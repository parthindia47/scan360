
# 📊 Stock Industry Dashboard

This project is a full-stack web app to visualize stock data grouped by industries using a CSV file.

---

# 🚀 How to Run the Project

This project has two parts:
- **Client**: React app (frontend)
- **Server**: Node.js + Express app (backend)

You must start **both** separately.

---

## 1️⃣ Start the Server

The server runs on **Node.js** and uses **Express**.

### 📍 Steps:

1. Open a terminal and go to the `server/` folder:

    ```bash
    cd server
    ```

2. Install the required packages (only first time):

    ```bash
    npm install
    ```

3. Start the server with live reloading (using nodemon):

    ```bash
    npm run dev
    ```

    OR if you want to start without live reload:

    ```bash
    npm start
    ```

- The server will start at: **http://localhost:5000**
- It serves the industry-stock data via REST API.

---

## 2️⃣ Start the Client

The client is a **React** app created with **Create React App (CRA)**.

NOTE MUST use npm install -D tailwindcss@3 postcss autoprefixer

### 📍 Steps:

1. Open a new terminal and go to the `client/` folder:

    ```bash
    cd client
    ```

2. Install the required packages (only first time):

    ```bash
    npm install
    ```

3. Start the React app:

    ```bash
    npm start
    ```

- The client will start at: **http://localhost:3000**
- It automatically opens in your default web browser.

---

# 🧠 Notes

- Make sure **both** client and server are running in **separate terminals** at the same time.
- The React client **fetches data from** the Node.js server (`localhost:5000`).
- If you change code in server files, nodemon will **auto-restart** the server.
- If you change code in React files, React will **hot-reload** automatically in browser.

---

# 📂 Folder Structure (Quick View)

```
/server
    server.js
    package.json
    /data
        updated_yahoo_with_tji.csv

/client
    src/
        App.js
        index.js
        index.css
    public/
        index.html
    package.json
```

---

# 📦 Technologies Used

- Backend: Node.js, Express, csv-parser
- Frontend: React, Axios
