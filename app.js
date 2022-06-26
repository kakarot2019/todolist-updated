//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://Kumadi:8910139320@cluster0.i08mtrr.mongodb.net/todolistDB", {useNewUrlParser: true});

//creating a schema 
const itemsSchema = {
  name: String
};
//creating a table obeying the schema 
const Item = mongoose.model("Item", itemsSchema);

//creating row items to be inserted into the table
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

//defaultitems items to be present in the starting
const defaultItems = [item1, item2, item3];

//creating new schema of different list to be prtesent on different pages that is customised using url
const listSchema = {
  name: String,
  items: [itemsSchema]
};

//creating table
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  //reading inserted data from db to the server
  Item.find({}, function(err, foundItems){
    //if empty then only insert, once inserted no need to insert again
    if (foundItems.length === 0) {
      //inserting dafaltitems to the database
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully savevd default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  });

});

app.get("/:customlistName", function(req,res){
  //getting that custonListName using .params
  const customListName= req.params.customlistName;
  //checking if that customname is already created and presented in the datbase , 
  //if yes then update thye existing or else create a new new and update it 
  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list;

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    //we will find that custum list and add that inb the database
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res){
  
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});

