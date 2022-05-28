const Product = require('../models/product');
const fileHelper = require('../util/deleteFile');
const {validationResult} = require('express-validator/check');

const Items_Per_Page = 3;

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing : false,
    hasError : false,
    product : {
      title : '',
      imageUrl : '',
      price : '',
      description : ''
    },
    validationError : [],
    errorMessage : null
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  // Because of Multer middleware we can extract the image from the req
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422)
    .render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing : false,
      hasError : true,
      product : {
        title : title,
        price : price,
        description : description
      },
      validationError : [],
      errorMessage : 'Attached file is not an image.'
    });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty() ) {
    return res.status(422)
    .render('admin/add-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing : false,
      hasError : true,
      product : {
        title : title,
        imageUrl : imageUrl,
        price : price,
        description : description
      },
      validationError : errors.array(),
      errorMessage : errors.array()[0].msg
    });
  }

  const imageUrl = image.path;

  const product = new Product({
    title : title,
    price : price,
    description : description,
    imageUrl : imageUrl,
    userId : req.user._id
  })
  product.save().then(result => {
    res.redirect('/');
  })
  .catch(err => {
    console.log (err);
    res.redirect('/500');
  });
  /*
  //--> MongoDb Code
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product(title, imageUrl, description, price, null, req.user._id);
  product.save().then(result => {
    res.redirect('/');
  })
  .catch(err => console.log(err)); <--*/
  /*
  req.user.createProduct({
    title : title,
    price : price,
    description : description,
    imageUrl : imageUrl,
  })*/
  /*
  Product.create({
    title : title,
    price : price,
    description : description,
    imageUrl : imageUrl,
    userId : req.user.id
  })*/
  

  /*const product = new Product(null,title, imageUrl, description, price);
  product.save()
    .then(()=>{
      res.redirect('/')
    })
    .catch(err=>console.log(err));*/
};


exports.getEditProduct = (req,res,next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
  .then(product => {
    if (!product){
      return res.redirect('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing : editMode,
      product : product,
      hasError : false,
      validationError : [],
      errorMessage : null
    });
  })
  .catch(err => {
    console.log (err);
    res.redirect('/500');
  });
};

exports.postEditProduct = (req,res,next) => {

  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const image = req.file;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty() ) {
    return res.status(422)
    .render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/add-product',
      editing : true,
      hasError : true,
      product : {
        title : updatedTitle,
        price : updatedPrice,
        description : updatedDescription,
        _id : prodId
      },
      validationError : errors.array(),
      errorMessage : errors.array()[0].msg
    });
  }

  Product.findById(prodId).then(product => {
    product.title = updatedTitle;
    product.price = updatedPrice;
    product.description = updatedDescription;
    if (image) {
      fileHelper.deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }
    return product.save();
  })
  .then(result => {
    res.redirect('/admin/products');
  })
  .catch(err => {
    console.log (err);
    res.redirect('/500');
  });

  /*--> MongoDb Code
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImageUrl = req.body.imageUrl;
  const updatedPrice = req.body.price;
  const updatedDescription = req.body.description;
  const product = new Product(updatedTitle,updatedImageUrl,updatedDescription,updatedPrice,prodId );
  product.save()
  .then(result => {
    console.log('Updated');
    res.redirect('/admin/products');
  })
  .catch(err => console.log(err));<--*/
}

exports.getProducts = (req, res, next) => {

  const page = +req.query.page || 1;
  let totalItems;

  Product.find({userId : req.user._id})
  .count()
  .then(numProducts => {
    totalItems = numProducts;
    return Product.find()
    .skip((page-1)*Items_Per_Page) // skip function helps us to skip number of items. E.g, If we are on the first page then (1-1)*2 = 0 items to skip on the first page
    .limit(Items_Per_Page);
  })
  .then(products => {
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products',
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
};

exports.postDeleteProduct = (req,res,next) => {

  const prodId = req.body.productId;
  Product.findById(prodId)
  .then(product => {
    if(!product){
      return next(new Error('Product not found!'))
    }
    fileHelper.deleteFile(product.imageUrl);
    return Product.findByIdAndRemove(prodId)
  })
  .then(() => {
    res.redirect('/admin/products');
  })
  .catch(err => {
    console.log (err);
    res.redirect('/500');
  });

  /*--> MongoDb Code
  const prodId = req.body.productId;
  Product.deleteById(prodId)
  .then(() => {
    res.redirect('/admin/products');
  })
  .catch(err => console.log(err));*/
}