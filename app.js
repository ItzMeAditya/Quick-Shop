const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const errorController = require('./controllers/error');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

//const mongoConnect = require('./util/database').mongoConnect;
const mongoose = require('mongoose');
const User = require('./models/user');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const MONGODB_URI = process.env.MONGO_URI;

const app = express();
const store = new MongoDBStore ({
    uri : MONGODB_URI,
    collection : 'sessions'
})

const csrfProtection = csrf();


const fileStorage = multer.diskStorage ({
  destination : (req,file,cb) => {
    cb (null, 'images');
  },
  filename : (req, file, cb) => {
    cb (null,Math.random().toPrecision(6) + '-' + file.originalname);  // we using new date here to ensure that if we have more than one file with same name then filenames don't get overwrite
  }
});

const fileFilter = (req, file, cb ) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb (null, true);
  }else{
    cb (null, false);
  }
}

app.set('view engine', 'ejs');
app.set('views', 'views');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage : fileStorage, fileFilter : fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(
    session({
        secret:'my secret',
        resave:false,
        saveUninitialized : false,
        store : store
    })
)

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user){
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      throw new Error(err);
    });
});

app.use((req,res,next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get ('/500',errorController.get500);
app.use(errorController.get404);

const PORT = process.env.PORT || 5000;
mongoose.connect(MONGODB_URI)
.then( () => {
    app.listen(PORT,console.log(`Connected to the Port ${PORT}`));
})
.catch((err) => console.log(err));
