import express from "express";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectRedis from "connect-redis";
import redis from "redis";
import { promisify } from "util";
// import flash from "express-flash";

const client = redis.createClient({ host, port });
const host = "localhost";
const port = "6379";
const RedisStore = connectRedis(session);
const store = new RedisStore({ client, port, host });
const hgetallAsync = promisify(client.hgetall).bind(client);

const app = express();
app.use(
  session({
    secret: "fuckRedis",
    store,
    saveUninitialized: false,
    resave: false
  })
);
app.use(passport.initialize());
app.use(passport.session());
// app.use(flash());
app.use((req, res, next) => {
  console.log("SESSION???????");
  console.log(res.user);
  console.log(res.session);
  console.log("==============");
  next();
});

// passport.serializeUser((user, done) => {
//   console.log("SERIALIZE!!!!!");
//   console.log({ user });
//   console.log("==============");
//   done(null, user);
// });
passport.serializeUser(store.serializer.parse);

// passport.deserializeUser(function(user, done) {
//   console.log("DEEEEEEEESERIALIZE!!!!!");
//   console.log({ user });
//   console.log("==============");
//   done(null, user);
// });
passport.deserializeUser(store.serializer.stringify);

passport.use(
  new LocalStrategy(async function(username, password, done) {
    try {
      const user = await hgetallAsync(username);
      if (user && user.password === password) {
        console.log("Login success!");
        return done(null, user);
      } else {
        console.log("Login fail!");
        return done(null, false);
      }
    } catch (error) {
      console.log(error);
      return done(null, false);
    }
  })
);

export const home = async (req, res) => {
  res.render("home", { title: "Home" });
};

export const getJoin = (req, res) => {
  res.render("join", { title: "Join" });
};

export const postJoin = async (req, res, next) => {
  const { name, email, password, password2 } = req.body;
  if (password !== password2) {
    // req.flash("error", "Passwords don't match");
    console.log("Passwords don't match");
    res.status(400); // Bad request
    res.render("join", { title: "Join" });
  } else {
    try {
      const user = await hgetallAsync(name);
      if (user) {
        console.log("Already joined!");
        res.status(400);
        res.render("join", { title: "Join" });
      } else {
        client.hmset(name, "name", name, "email", email, "password", password);
        next();
      }
    } catch (error) {
      console.log(error);
      res.redirect("/");
    }
  }
};

export const getLogin = (req, res) => res.render("login", { title: "Log In" });
export const postLogin = (req, res) => {
  console.log("LOGIN!!!!!!!");
  console.log(req.user);
  console.log("==============");
  res.redirect("/");
};

export const logout = (req, res) => {
  console.log("LOGOUT");
  console.log(req.user);
  console.log(req.session);
  console.log("==============");
  req.logout();
  res.redirect("/");
};

export const getMe = (req, res) => {
  console.log("###########");
  console.log(req.session);
  console.log(req.user);
  res.render("userDetail", { title: "User Detail", user: req.user });
};

app.get("/", home);

app.get("/join", getJoin);
app.post("/join", postJoin, postLogin);

app.get("/login", getLogin);
app.post("/login", passport.authenticate("local"), postLogin);

app.get("/logout", logout);

app.get("/me", getMe);

export default app;
