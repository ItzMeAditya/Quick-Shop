const crypto = require('crypto');

const bycrypt = require('bcryptjs');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');

exports.getLogin = (req,res,next) => {
  let message = req.flash('error');
  if (message.length > 0){
    message = message[0];
  }
  else{
    message = null;
  }
  res.render ('auth/login',{
      path : '/login',
      pageTitle : 'Login',
      isAuthenticated : false,
      errorMessage : message,
      oldInput : {
        email : '',
        password : '',
      },
      validationError : []
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if (message.length > 0){
    message = message[0];
  }
  else{
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    errorMessage : message,
    oldInput : {
      email : '',
      password : '',
      confirmPassword : ''
    },
    validationError : []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // status code 422 is for invalid validation
    return res.status(422).
      render ('auth/login',{
        path : '/login',
        pageTitle : 'Login',
        errorMessage : errors.array()[0].msg,
        oldInput : {
          email : email,
          password : password,
        },
        validationError : errors.array()
      });
  }
  User.findOne({email:email})
    .then(user => {
      if (!user) {
        return res.status(422).
          render ('auth/login',{
            path : '/login',
            pageTitle : 'Login',
            errorMessage : 'Email not found !',
            oldInput : {
              email : email,
              password : password,
            },
            validationError : []
          });
      }
      bycrypt
        .compare(password,user.password)
        .then(doMatch => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save( () => {
              res.redirect('/');
            });
          }
          return res.status(422).
            render ('auth/login',{
              path : '/login',
              pageTitle : 'Login',
              errorMessage : 'Invalid Password !',
              oldInput : {
                email : email,
                password : password,
              },
              validationError : []
            });
        })
        .catch(err => {
          console.log(err);
          res.redirect('/login');
        })
    })
    .catch(err => {
      console.log (err);
      res.redirect('/500');
    });
};
  
exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // status code 422 is for invalid validation
    return res.status(422)
    .render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage : errors.array()[0].msg,
      oldInput : {
        email : email,
        password : password,
        confirmPassword : confirmPassword
      },
      validationError : errors.array()
    });
  }
  bycrypt
    .hash(password,12)
    .then (hashedPassword => {
      const user = new User ({
        email : email,
        password : hashedPassword,
        cart : {items : []}
      });
      return user.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      console.log (err);
      res.redirect('/500');
    });
};

exports.postLogout = (req,res,next) => {
    req.session.destroy((err)=>{
      res.redirect('/');
    })
};

exports.getReset = (req,res,next) => {
  let message = req.flash('error');
  if (message.length > 0){
    message = message[0];
  }
  else{
    message = null;
  }
  res.render ('auth/reset',{
      path : '/reset',
      pageTitle : 'Reset Password',
      errorMessage : message
  });
};

exports.postReset = (req,res,next) => {
  crypto.randomBytes(32,(err,buffer) => {
    if (err)
    {
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne ({email : req.body.email})
    .then(user => {
      if (!user) {
        req.flash('error','No account with that email found !');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now()+3600000;
      return user.save()
      .then(result => {
        // Here instead of redirect you can send reset link to users email
        res.redirect (`/reset/${token}`);
      });
    })
    .catch(err => {
      console.log (err);
      res.redirect('/500');
    });
  })
}

exports.getNewPassword = (req,res,next) => {
  const token = req.params.token;
  User.findOne({resetToken : token, resetTokenExpiration : {$gt : Date.now()}})
  .then(user => {
    let message = req.flash('error');
    if (message.length > 0){
      message = message[0];
    }
    else{
      message = null;
    }
    res.render ('auth/new-password',{
        path : '/new-password',
        pageTitle : 'Update Password',
        errorMessage : message,
        userId : user._id.toString(),
        passwordToken : token
    });
  })
  .catch(err => {
    console.log (err);
    res.redirect('/500');
  });
};

exports.postNewPassword = (req,res,next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser ;

  User.findOne({
    resetToken : passwordToken, 
    resetTokenExpiration : {$gt : Date.now()}, 
    _id : userId
  })
  .then (user => {
    resetUser = user;
    return bycrypt.hash(newPassword,12);
  })
  .then(hashedPassword => {
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();
  })
  .then(()=>{
    res.redirect('/login');
  })
  .catch(err => {
    console.log (err);
    res.redirect('/500');
  });
}