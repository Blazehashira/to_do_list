//jshint esversion:6

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

mongoose.connect(
  "mongodb+srv://admin_nasir:moh149san@atlascluster.94r7qql.mongodb.net/todolistDB"
);
const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Learning",
});
const item2 = new Item({
  name: "Gisting",
});
const item3 = new Item({
  name: "Relaxing",
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  async function findItems() {
    try {
      const items = await Item.find({});

      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
            console.log("Data inserted");
          })
          .catch(function (error) {
            console.log(error);
          });
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    } catch (err) {
      console.log(err);
    }
  }
  findItems();
});

app.get("/:listGroup", function (req, res) {
  const customListName = _.capitalize(req.params.listGroup);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList != null) {
        // console.log(`the IF block ran ${foundList}`);
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      } else {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect(`/${customListName}`);
        // console.log(`New document was added (else block) ${foundList}`);
      }
    })
    .catch((error) => {
      console.log("ERROR: ❌", error);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;
  console.log(`the value of listName is ${listName}`);
  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then(function (foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect(`/${listName}`);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function () {
        console.log(`Successfully removed ${listName}`);
      })
      .catch(function (err) {
        console.log(err);
      });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then(() => {
        res.redirect(`/${listName}`);
      })
      .catch(function (err) {
        console.log(err);
      });
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
