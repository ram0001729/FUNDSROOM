const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { tool } = require('@langchain/core/tools');
const { z } = require('zod');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { MemorySaver } = require('@langchain/langgraph');
const { HumanMessage } = require('@langchain/core/messages');

// Define Tools
const getProductStockTool = tool(
  async ({ search_term }) => {
    try {
      const query = `
        SELECT name, sku, category, current_stock, min_stock, unit_price 
        FROM products 
        WHERE name ILIKE $1 OR sku ILIKE $1
        LIMIT 10
      `;
      const res = await db.query(query, [`%${search_term || ''}%`]);
      if (res.rows.length === 0) return "No products found matching that search.";
      return JSON.stringify(res.rows);
    } catch (e) {
      return "Error querying product stock.";
    }
  },
  {
    name: 'get_product_stock',
    description: 'Use this to find current stock levels, price, and category of products. Pass an empty string to get general stock, or a specific product name.',
    schema: z.object({
      search_term: z.string().optional()
    })
  }
);

const getCustomerInfoTool = tool(
  async ({ customer_name }) => {
    try {
      const query = `
        SELECT name, mobile, business_name, status, address
        FROM customers
        WHERE name ILIKE $1 OR business_name ILIKE $1
        LIMIT 5
      `;
      const res = await db.query(query, [`%${customer_name}%`]);
      if (res.rows.length === 0) return "No customers found.";
      return JSON.stringify(res.rows);
    } catch (e) {
      return "Error querying customer info.";
    }
  },
  {
    name: 'get_customer_info',
    description: 'Use this to get details about a specific customer, like their phone number, business name, or status.',
    schema: z.object({
      customer_name: z.string()
    })
  }
);

const getSalesSummaryTool = tool(
  async ({ period_days }) => {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT ch.id) as total_orders,
          SUM(ci.quantity * ci.product_snapshot_price) as total_sales,
          SUM(ci.quantity * (ci.product_snapshot_price - COALESCE(p.cost_price, 0))) as total_profit
        FROM challan_items ci
        JOIN challans ch ON ci.challan_id = ch.id
        LEFT JOIN products p ON ci.product_id = p.id
        WHERE ch.status = 'Confirmed' 
          AND ch.created_at >= CURRENT_DATE - ($1 || ' days')::interval
      `;
      const res = await db.query(query, [period_days || 30]);
      return JSON.stringify(res.rows[0]);
    } catch (e) {
      return "Error querying sales summary.";
    }
  },
  {
    name: 'get_sales_summary',
    description: 'Use this to get total revenue, profit, and order count for a specific number of past days (e.g., 7 for last week, 30 for last month).',
    schema: z.object({
      period_days: z.number().default(30)
    })
  }
);

const getLowStockAlertsTool = tool(
  async () => {
    try {
      const query = `
        SELECT name, category, current_stock, min_stock 
        FROM products 
        WHERE current_stock <= min_stock
        ORDER BY current_stock ASC
      `;
      const res = await db.query(query);
      if (res.rows.length === 0) return "All items are adequately stocked. No low stock alerts.";
      return JSON.stringify(res.rows);
    } catch (e) {
      return "Error querying low stock alerts.";
    }
  },
  {
    name: 'get_low_stock_alerts',
    description: 'Use this to find all products that are currently below their minimum stock threshold.',
    schema: z.object({})
  }
);

const getRecentTransactionsTool = tool(
  async ({ limit }) => {
    try {
      const query = `
        SELECT c.challan_number, c.customer_name, c.status, c.created_at, SUM(ci.quantity * ci.product_snapshot_price) as total_amount
        FROM challans c
        JOIN challan_items ci ON c.id = ci.challan_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
        LIMIT $1
      `;
      const res = await db.query(query, [limit || 5]);
      if (res.rows.length === 0) return "No recent transactions found.";
      return JSON.stringify(res.rows);
    } catch (e) {
      return "Error querying recent transactions.";
    }
  },
  {
    name: 'get_recent_transactions',
    description: 'Use this to get the most recent sales invoices (challans) and their total amounts.',
    schema: z.object({
      limit: z.number().default(5)
    })
  }
);

const tools = [getProductStockTool, getCustomerInfoTool, getSalesSummaryTool, getLowStockAlertsTool, getRecentTransactionsTool];

// Initialize Memory Saver for maintaining conversation context
const checkpointer = new MemorySaver();

const getAgent = () => {
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0,
  });

  return createReactAgent({
    llm: model,
    tools: tools,
    checkpointSaver: checkpointer,
    messageModifier: `You are DUNDOO Assistant, a highly capable AI ERP manager. 
Your primary job is to help the business owner analyze their data, manage inventory, and track sales.
Guidelines:
1. Always be professional, concise, and helpful.
2. When listing products, customers, or sales, FORMAT your response using Markdown tables for readability.
3. If you don't know the answer, use a tool to look it up. If no tool helps, politely say you don't have access to that information.
4. Currency is in INR (₹).`
  });
};

router.post('/', authMiddleware(['Admin', 'Sales', 'Accounts', 'Warehouse']), async (req, res) => {
  try {
    const { message, thread_id } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    if (!process.env.GEMINI_API_KEY) {
      // Mock fallback if API key is missing
      return res.json({ 
        reply: "Hello! I am the DUNDOO AI Assistant. I have been fully installed with tools to check your stock, customers, and sales.\n\nHowever, my **Gemini API Key** has not been added to the `.env` file yet, so I am currently running in offline mock mode.\n\nPlease add `GEMINI_API_KEY=your_key_here` to `backend/.env` and restart the server to chat with your live data!" 
      });
    }

    const agent = getAgent();
    
    // We use the thread_id from the frontend to keep track of the conversation
    const config = { configurable: { thread_id: thread_id || 'default_thread' } };

    const result = await agent.invoke({ messages: [new HumanMessage(message)] }, config);

    // The result.messages array contains the history. We just want the last message from the AI.
    const lastMessage = result.messages[result.messages.length - 1];

    res.json({ reply: lastMessage.content });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to process chat' });
  }
});

module.exports = router;
