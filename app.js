if (process.env.NODE_ENV !== "production") {
    require('dotenv').config({quiet: true});
}



const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const Joi = require('joi');

const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');

const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
// const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');

// const Campground = require('./models/campground');
// const { escape } = require('querystring');

// const campground = require('./models/campground');
// const Review = require('./models/review');

// const campgrounds = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');

const MongoDBStore = require("connect-mongo")(session);


const dbUrl = process.env.DB_URL || 'mongodb+srv://sg2023soniagupta_db_user:PC8BWaydVixFyoTU@<yourNewCluster>.mongodb.net/yelp-camp';



mongoose.connect(dbUrl)
    .then(() => console.log("Database connected"))
    .catch(err => console.error("connection error:", err));

const app = express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
// app.use(mongoSanitize({
//     replaceWith: '_'
// }))
const secret = process.env.SECRET 
// || 'thisshouldbeabettersecret!';

const store = new MongoDBStore({
    url: dbUrl,
    secret :'thishouldbeabettersecret',
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret : 'thishouldbeabettersecret!',   
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(flash());
// app.use(helmet());


// const scriptSrcUrls = [
//     "https://stackpath.bootstrapcdn.com",
//     "https://kit.fontawesome.com",
//     "https://cdnjs.cloudflare.com",
//     "https://cdn.jsdelivr.net",
//     "https://cdn.maptiler.com/",
//     "https://code.jquery.com",  // ✅ for jQuery
// ];
// const styleSrcUrls = [
//     "https://kit-free.fontawesome.com",
//     "https://stackpath.bootstrapcdn.com",
//     "https://fonts.googleapis.com",
//     "https://use.fontawesome.com",
//     "https://cdn.jsdelivr.net",
//     "https://cdn.maptiler.com/",
// ];
// const connectSrcUrls = [
//     "https://api.maptiler.com/",
//     "https://*.maptiler.com/",
// ];
// const fontSrcUrls = [];

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: [],
//       connectSrc: [
//         "'self'",
//         "http://localhost:3000",
//         "https://api.maptiler.com/",
//         "https://*.maptiler.com/",
//         "https://stackpath.bootstrapcdn.com",  // ✅ fix for Bootstrap map
//       ],
//       scriptSrc: [
//         "'unsafe-inline'",
//         "'self'",
//         "http://localhost:3000",
//         "https://stackpath.bootstrapcdn.com",
//         "https://kit.fontawesome.com",
//         "https://cdnjs.cloudflare.com",
//         "https://cdn.jsdelivr.net",
//         "https://cdn.maptiler.com/",
//         "https://code.jquery.com",
//       ],
//       styleSrc: [
//         "'self'",
//         "'unsafe-inline'",
//         "http://localhost:3000",
//         "https://kit-free.fontawesome.com",
//         "https://stackpath.bootstrapcdn.com",
//         "https://fonts.googleapis.com",
//         "https://use.fontawesome.com",
//         "https://cdn.jsdelivr.net",
//         "https://cdn.maptiler.com/",
//       ],
//       workerSrc: ["'self'", "blob:"],
//       childSrc: ["blob:"],
//       objectSrc: [],
//       imgSrc: [
//         "'self'",
//         "blob:",
//         "data:",
//         "http://localhost:3000",
//         "https://res.cloudinary.com/demjj2qoy/",
//         "https://images.unsplash.com",
//         "https://source.unsplash.com",   // ✅ added
//         "https://plus.unsplash.com",     // ✅ added
//         "https://cdn.maptiler.com/",
//         "https://*.unsplash.com",
//       ],
//       fontSrc: ["'self'", "http://localhost:3000"],
//     },
//   })
// );





app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)



        

app.get('/', (req, res) => {
    res.render('home')
});



app.all(/(.*)/, (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', { err })
})

const port = process.env.PORT || 3000;
app.listen(3000, () => {
    console.log(`Serving on port ${3000}`)
})
