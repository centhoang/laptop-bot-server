const express = require("express");
const app = express();
let fetch = require("node-fetch");
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/webhook", (req, res) => {
  // the webhook GET route checks the query of the webhook route
  // to see if the hub.verify_token parameter is equal to the same
  // callback token set on the facebook app dashboard
  // this is a security check
  //remember that I set "devc" as the callback parameter on
  // the facebook app dashboard
  console.log(req.query);
  if (req.query["hub.verify_token"] === "haxayonn") {
    res.send(req.query["hub.challenge"]);
  } else {
    res.send("Error, wrong validation token");
  }
});

app.post("/webhook", async (req, res) => {
  console.log("swakcy");
  // extracts the message sent from the messenger application
  let [message] = req.body.entry[0].messaging;

  //sends a GET request to the wit.ai platform
  let get = `https://api.wit.ai/message?v=20200923&q=${message.message.text}`;
  let answer = await fetch(encodeURI(get), {
    headers: {
      Authorization: `Bearer ${process.env["witaccess"]}`
    }
  });
  let wit = await answer.json();

  //tries to ensure that property to extract the value from the wit.ai response exists
  let mes;
  let data = {
    laptop: {
      Asus_ZenBook_Duo_UX481 :
    }
  };

  if (wit.entities && wit.entities["greeting_phrase:greeting_phrase"]) {
    mes = "Chào bạn! Bạn muốn đặt hàng hay tìm hiểu thêm thông tin sản phẩm nào trong 5 sản phẩm mình đề xuất sau đây ạ: Asus ZenBook Duo UX481, MSI GE66 Raider 11UG, Dell XPS 13 9310, Asus VivoBook A515EP, Acer Aspire 5 A514-54-39KU";
  }
  else if ((wit.entities && wit.entities["laptop_name:laptop_name"] && wit.entities["common_info_phrase:common_info_phrase"]) || (wit.entities && wit.entities["laptop_name:laptop_name"])) {
    if (wit.entities["laptop_name:laptop_name"][0].value == "Asus ZenBook Duo UX481") {
        mes = `Asus ZenBook Duo UX481
- Giá: 30.990.000 đ
- Chất lượng: đánh giá chung của khách hàng là 4 sao
- CPU: i5, 10210U, 1.6GHz
- RAM: 8 GB, DDR3L (On board), 2133 MHz
- Ổ cứng: SSD 512 GB NVMe PCIe`;
    }
    else {
      mes = "chưa phải laptop cần hỏi :)";
    }
  }
  else {
    mes = "Vui lòng bạn ghi chính xác tên sản phẩm! Xin cảm ơn"
  }

  // obtain the sender id from message object
  let body = {
    recipient: {
      id: message.sender.id
    },
    message: {
      text: mes
    }
  };

  /*sends a response back to the user on Messenger */
  try {
    let ans = await fetch(
      "https://graph.facebook.com/v8.0/me/messages?access_token=" +
        process.env["fbapi"],
      {
        method: "post",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
      }
    );
    let res = await ans.json();
    console.log(res);
  } catch (e) {
    console.log("error", e);
  }

  res.send("");
});

// listen for requests
const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
