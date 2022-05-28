const mongoose = require('mongoose');

const Schema  = mongoose.Schema;

const ProductSchema = new Schema ({
  title : {
    type : String,
    required : true
  },
  price : {
    type : Number,
    required : true
  },
  description : {
    type : String,
    required : true
  },
  imageUrl : {
    type : String,
    required : true
  },
  userId : {
    type : Schema.Types.ObjectId,
    ref : 'User',
    required : true
  }
})

module.exports = mongoose.model('Product',ProductSchema);




/*
const fs = require('fs');
const path = require('path');

const Cart = require('./cart');

const p = path.join(
  path.dirname(require.main.filename),
  'data',
  'products.json'
);

const getProductsFromFile = cb => {
  fs.readFile(p, (err, fileContent) => {
    if (err) {
      cb([]);
    } else {
      cb(JSON.parse(fileContent));
    }
  });
};

module.exports = class Product {
  constructor(id,title, imageUrl, description, price) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save() {
    getProductsFromFile(products => {
      if (this.id)
      {
        const existingProductIndex = products.findIndex(prod => prod.id === this.id)
        const updatedProduct = [ ...products ];
        updatedProduct[existingProductIndex] = this;
        fs.writeFile(p, JSON.stringify(updatedProduct), err => {
          console.log(err);
        });
      }
      else {
        this.id = Math.random().toString();
        products.push(this);
        fs.writeFile(p, JSON.stringify(products), err => {
          console.log(err);
        });
      }
    });
  }

  static fetchAll(cb) {
    getProductsFromFile(cb);
  }

  static findById(id,cb) {
    getProductsFromFile (products => {
      const product = products.find(prod => prod.id === id)
      cb(product);
    })
  }

  static deleteById (id){
    getProductsFromFile (products => {
      const product = products.find(prod => prod.id === id)
      const updatedProduct = products.filter (prod => prod.id !== id);
      fs.writeFile (p, (JSON.stringify(updatedProduct)), err => {
        if (!err)
        {
          Cart.deleteProduct(id,product.price);
        }
      })
    })
  }
};*/

/*
const db = require('../util/database');

module.exports = class Product {
  constructor(id,title, imageUrl, description, price) {
    this.id = id;
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
  }

  save() {
    return db.execute('INSERT INTO products (title,price,description,imageUrl) VALUES (?,?,?,?)',[this.title,this.price,this.description,this.imageUrl]);
  }

  static fetchAll() {
    return db.execute('SELECT * FROM products');
  }

  static findById(id) {
    return db.execute('SELECT * FROM products WHERE products.id = ?',[id]);
  }

  static deleteById (id){

  }
}; */

/*
const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Product = sequelize.define('products',{
  id : {
    type : Sequelize.INTEGER,
    autoIncrement : true,
    allowNull : false,
    primaryKey : true
  },
  title : {
    type : Sequelize.STRING,
    allowNull : false
  },
  price : {
    type : Sequelize.DOUBLE,
    allowNull : false
  },
  description : {
    type : Sequelize.STRING,
    allowNull : false
  },
  imageUrl : {
    type : Sequelize.STRING,
    allowNull : false
  }
});*/

/*
const mongodb = require('mongodb');
const getDb = require('../util/database').getDb;

class Product {
  constructor(title, imageUrl, description, price, id, userId) {
    this.title = title;
    this.imageUrl = imageUrl;
    this.description = description;
    this.price = price;
    this._id = id ? new mongodb.ObjectId(id) : null;
    this.userId = userId;
  }

  save () {
    const db = getDb();
    let dbOp;
    if (this._id){
      dbOp = db.collection('products').updateOne({_id:this._id},{$set : this});
    }else{
      dbOp = db.collection('products').insertOne(this);
    }
    return dbOp
  }

  static fetchAll () {
    const db = getDb();
    return db.collection('products')
    .find()
    .toArray()
    .then (products => {
      return products;
    })
    .catch(err => console.log(err));
  }

  static findById(prodId) {
    const db = getDb();
    return db
    .collection('products')
    .find({_id : new mongodb.ObjectId(prodId)})
    .next()
    .then(product => {
      return product;
    })
    .catch(err => console.log(err));
  }

  static deleteById (prodId) {
    const db = getDb();
    return db
    .collection('products')
    .deleteOne({_id : new mongodb.ObjectId(prodId)})
    .then(result => {
      console.log('Product deleted');
    })
    .catch(err => console.log(err));
  }
}

module.exports = Product;*/