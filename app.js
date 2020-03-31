import express from "express";
// import cookieParser from "cookie-parser";

import controller from "./controllers";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("views");
app.set("view engine", "pug");

// app.use(cookieParser());
app.use(controller);
export default app;
