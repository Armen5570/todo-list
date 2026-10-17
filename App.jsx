import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/todos";

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function request(url, options) {
    const res = await fetch(url, options);
    if (!res.ok) {
      let message = "Սխալ սերվերի հետ";
      try {
        const data = await res.json();
        if (data.error) message = data.error;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    return res.status === 204 ? null : res.json();
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await request(API_URL);
        setTodos(data);
      } catch (e) {
        setError("Չհաջողվեց միանալ սերվերին։ Համոզվիր, որ backend-ը աշխատում է։");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function addTodo(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    try {
      setError("");
      const created = await request(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      setTodos((prev) => [...prev, created]);
      setText("");
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleTodo(todo) {
    try {
      setError("");
      const updated = await request(`${API_URL}/${todo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? updated : t)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteTodo(id) {
    try {
      setError("");
      await request(`${API_URL}/${id}`, { method: "DELETE" });
      setTodos((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  function startEdit(todo) {
    setEditId(todo.id);
    setEditText(todo.text);
  }

  async function saveEdit(id) {
    const value = editText.trim();
    if (!value) return;
    try {
      setError("");
      const updated = await request(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditId(null);
      setEditText("");
    } catch (e) {
      setError(e.message);
    }
  }

  const doneCount = todos.filter((t) => t.completed).length;

  return (
    <div className="container">
      <h1>To-Do List</h1>

      <form className="add-form" onSubmit={addTodo}>
        <input
          type="text"
          placeholder="Նոր առաջադրանք..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit">Ավելացնել</button>
      </form>

      {error && <p className="error">{error}</p>}
      {loading && <p className="info">Բեռնվում է...</p>}
      {!loading && todos.length === 0 && !error && (
        <p className="info">Առաջադրանքներ դեռ չկան</p>
      )}

      <ul className="list">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.completed ? "done" : ""}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo)}
            />

            {editId === todo.id ? (
              <>
                <input
                  className="edit-input"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(todo.id);
                    if (e.key === "Escape") setEditId(null);
                  }}
                  autoFocus
                />
                <button onClick={() => saveEdit(todo.id)}>Պահպանել</button>
                <button className="secondary" onClick={() => setEditId(null)}>
                  Չեղարկել
                </button>
              </>
            ) : (
              <>
                <span className="text">{todo.text}</span>
                <button className="secondary" onClick={() => startEdit(todo)}>
                  Փոփոխել
                </button>
                <button className="danger" onClick={() => deleteTodo(todo.id)}>
                  Ջնջել
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      {todos.length > 0 && (
        <p className="info">
          Կատարված է {doneCount} / {todos.length}
        </p>
      )}
    </div>
  );
}