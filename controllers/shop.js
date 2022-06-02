const fs = require('fs');
const path = require('path');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_KEY);

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const Items_Per_Page = 3;

exports.getProducts = (req, res, next) => {

  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
  .count()
  .then(numProducts => {
    totalItems = numProducts;
    return Product.find()
    .skip((page-1)*Items_Per_Page) // skip function helps us to skip number of items. E.g, If we are on the first page then (1-1)*2 = 0 items to skip on the first page
    .limit(Items_Per_Page);
  })
  .then(products => {
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products',
      currentPage : page,
      totalProducts : totalItems,
      hasNextPage : Items_Per_Page * page < totalItems,
      hasPreviousPage : page > 1,
      nextPage : page + 1,
      previousPage : page - 1,
      lastPage : Math.ceil(totalItems / Items_Per_Page)
    });
  })
  .catch(err => {
    console.log(err);
    res.redirect('/500')
  });

  /*--> MongoDb Code
  Product.fetchAll().then(products =>{
    res.render('shop/product-list', {
      prods: products,
      pageTitle: 'All Products',
      path: '/products'
    });
  }).catch(err => console.log(err)); <--*/


  /*Product.fetchAll()
  .then(([rows,fieldData])=>{
    res.render('shop/product-list', {
      prods: rows,
      pageTitle: 'All Products',
      path: '/products'
    });
  })
  .catch(err => console.log(err));*/
};

exports.getProduct = (req,res,next) => {
  // In mongoose we have function already for us findById and also we can pass string id to that and mongoose converts it into ObjectId self,we don't have to worry for that

  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail',{
        prod : product,
        pageTitle : product.title,
        path : '/products',
      });
    })
    .catch(err => {
      console.log (err);
      res.redirect('/500');
    });
}

exports.getIndex = (req, res, next) => {
// In mongoose we have a static function find which returns the array of all the products not the cursor as we get in MongoDb
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
  .count()
  .then(numProducts => {
    totalItems = numProducts;
    return Product.find()
    .skip((page-1)*Items_Per_Page) // skip function helps us to skip number of items. E.g, If we are on the first page then (1-1)*2 = 0 items to skip on the first page
    .limit(Items_Per_Page);
  })
  .then(products => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      currentPage : page,
      totalProducts : totalItems,
      hasNextPage : Items_Per_Page * page < totalItems,
      hasPreviousPage : page > 1,
      nextPage : page + 1,
      previousPage : page - 1,
      lastPage : Math.ceil(totalItems / Items_Per_Page)
    });
  })
  .catch(err => {
    console.log (err);
    res.redirect('/500');
  });

  /*--> MongoDb Code
  Product.fetchAll()
  .then(products => {
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/'
    });
  }).catch(err => console.log(err));<--*/

  /*Product.fetchAll()
    .then(([rows,fieldData])=>{
      res.render('shop/index', {
        prods: rows,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => console.log(err));*/
};


exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products : products,
      });
    })
    .catch(err => {
      console.log (err);
      res.redirect('/500');
    });

  /*--> MongoDb code
  req.user.getCart()
    .then(products => {
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products : products,
      });
    })
    .catch(err => console.log(err))*/;
};

exports.postCart = (req,res,next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
  .then(product => {
    return req.user.addToCart(product);
  })
  .then (result =>{
    res.redirect ('/cart');
  });
}


exports.postDeleteCartProduct = (req,res,next) => {
  const prodId = req.body.productId;
  req.user
  .removeFromCart(prodId)
  .then(()=>{
    res.redirect('/cart')
  })
  .catch(err => {
    console.log (err);
    res.redirect('/500');
  });
}

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;

  req.user
    .populate('cart.items.productId')
    .then(user => {
      products = user.cart.items;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      })

      return stripe.checkout.sessions.create ({
        payment_method_types : ['card'],
        line_items : products.map (p => {
          return {
            name : p.productId.title,
            description : p.productId.description,
            amount : p.productId.price * 100,
            currency : 'inr',
            quantity : p.quantity
          }
        }),
        // req.protocol gives the http or https & req.get('host') gives the localhost:5000 or the IP address after deployment
        success_url : req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url : req.protocol + '://' + req.get('host') + '/checkout/cancel'
      });
    })
    .then(session => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products : products,
        totalAmt : total,
        sessionId : session.id
      });
    })
    .catch(err => {
      console.log (err);
      res.redirect('/500');
    });
}


exports.getOrders = (req, res, next) => {
  Order.find({'user.userId' : req.user._id })
  .then(orders => {
    res.render('shop/orders', {
      path: '/orders',
      pageTitle: 'Your Orders',
      orders : orders,
    });
  })
  .catch(err => {
    console.log (err);
    res.redirect('/500');
  });
};


exports.postOrder = (req,res,next) => {
  req.user
    .populate('cart.items.productId')
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity : i.quantity, product : {...i.productId._doc} };
      });
      const order = new Order ({
        user : {
          email : req.user.email,
          userId : req.user._id
        },
        products : products
      });
      return order.save ();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      console.log (err);
      res.redirect('/500');
    });
};


exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
  .then(order => {
    if(!order)
    {
      return next (new Error('No Order Found!'));
    }
    if (order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Unathorized'));
    }
    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data','invoices',invoiceName);
    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="'+ invoiceName +'"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);

    pdfDoc.fontSize(28).fillColor('black').text('Invoice',{
      align : 'center'
    })
    .text('______________________________');

    pdfDoc.moveDown();
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc.fontSize(18).text (
        prod.product.title + ' - ' + prod.quantity + ' x ' + 'Rs ' + prod.product.price ,{
          align : 'center'
        }
      );
    });

    pdfDoc.text('-----------------------------------------------',{
      align : 'center'
    });
    pdfDoc.fontSize(22).text('Total Price : '+totalPrice,{
      align : 'center'
    });
    pdfDoc.end();
    /*fs.readFile(invoicePath, (err, data)=> {
      if (err) {
        return next(err);
      }
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="'+ invoiceName +'"');
      res.send(data);
    })*/

    // Here we just streaming the file as it won't take memory to load as above so our server can't be overflow
    /*const File = fs.createReadStream(invoicePath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="'+ invoiceName +'"');
    File.pipe(res);*/
  })
  .catch(err => {
    next(err);
  })
};
