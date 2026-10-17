import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/todo-app";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

const todoSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Todo = mongoose.model("Todo", todoSchema);

function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: "Սխալ id" });
  }
  next();
}

app.get("/api/todos", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: 1 });
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: "Սերվերի սխալ" });
  }
});

app.post("/api/todos", async (req, res) => {
  try {
    const text = (req.body.text || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Տեքստը պարտադիր է" });
    }
    const todo = await Todo.create({ text });
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: "Սերվերի սխալ" });
  }
});

app.put("/api/todos/:id", checkId, async (req, res) => {
  try {
    const update = {};
    if (typeof req.body.text === "string") {
      const text = req.body.text.trim();
      if (!text) {
        return res.status(400).json({ error: "Տեքստը չի կարող դատարկ լինել" });
      }
      update.text = text;
    }
    if (typeof req.body.completed === "boolean") {
      update.completed = req.body.completed;
    }
    const todo = await Todo.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!todo) {
      return res.status(404).json({ error: "Չգտնվեց" });
    }
    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: "Սերվերի սխալ" });
  }
});

app.delete("/api/todos/:id", checkId, async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: "Չգտնվեց" });
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Սերվերի սխալ" });
  }
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });