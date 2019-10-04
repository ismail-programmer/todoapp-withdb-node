//! initilizing
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');

//! declaring
const app = express();

var inputs = ['Food', 'Drink', 'Cook'];
let workItems = [];
//!using
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

//!creating mongo
mongoose.connect(
  'mongodb+srv://admin:admin@cluster0-7kcln.mongodb.net/todoListDB',
  {
    useNewUrlParser: true
  }, (err) => {
    console.log('-----------')
    console.log(err);
  }
);

//! Schema

const itemSchema = {
  name: String
};

//! Model and default data

const Item = mongoose.model('Item', itemSchema);

const work1 = new Item({
  name: 'Welcome to your todo list.'
});
const work2 = new Item({
  name: 'Hit the + button to add a new item.'
});
const work3 = new Item({
  name: '<-- Hit this to delete an item.'
});

const defaultItems = [work1, work2, work3];

const ListSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model('List', ListSchema);

//! get request for home route as a template
app.get('/', function(req, res) {
  Item.find({}, function(err, todo) {
    if (todo.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log('There is an error');
        } else {
          console.log('SUCEESLY SAVED NEW ITEM');
        }
      });
      res.redirect('/');
    } else {
      res.render('index', {
        listTitle: 'Today',
        newItems: todo
      });
    }
  });
});

//! another get rooute
app.get('/about', function(req, res) {
  res.render('about');
});

//! another get rooute
app.get('/:customListName', function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, function(err, match) {
    if (!err) {
      if (!match) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        res.render('index', {
          listTitle: match.name,
          newItems: match.items
        });
      }
    }
  });
});

//! route for deleting todo
app.post('/delete', function(req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'Today') {
    Item.findByIdAndRemove(checkedItem, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('CHEKED AND DELETE');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItem } } },
      function(err, foundList) {
        if (!err) {
          res.redirect('/' + listName);
        }
      }
    );
  }
});

//!post route
app.post('/', function(req, res) {
  const itemName = req.body.todo;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if (listName === 'Today') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({ name: listName }, function(err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

//! port listing
app.listen(process.env.PORT || 3000, function(req, res) {
  console.log('server is runing');
});
