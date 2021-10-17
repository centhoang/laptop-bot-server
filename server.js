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
  let laptop_instance;

  let laptop_dict = [
    {
      name: "Asus ZenBook Duo UX481",
      price: "30.990.000 đ",
      quality: "đánh giá chung của khách hàng là 4 sao",
      cpu: "i5, 10210U, 1.6GHz",
      ram: "8 GB, DDR3L (On board), 2133 MHz",
      hard_drive: "SSD 512 GB NVMe PCIe"
    },
    {
      name: "MSI GE66 Raider 11UG",
      price: "59.990.000 đ",
      quality: "đánh giá chung của khách hàng là 5 sao",
      cpu: "i7, 11800H, 2.30 GHz",
      ram: "16 GB, DDR4 2 khe (1 khe 8GB + 1 khe 8GB), 3200 MHz",
      hard_drive:
        "Hỗ trợ thêm 1 khe cắm SSD M.2 PCIe mở rộng (nâng cấp tối đa 2TB), 2 TB SSD NVMe PCIe"
    },
    {
      name: "Dell XPS 13 9310",
      price: "59.490.000 đ",
      quality: "đánh giá chung của khách hàng là 5 sao",
      cpu: "i7, 1165G7, 2.8GHz",
      ram: "16 GB, LPDDR4X (On board), 4267 MHz",
      hard_drive:
        "512 GB SSD NVMe PCIe (Có thể tháo ra, lắp thanh khác tối đa 1TB)"
    },
    {
      name: "Asus VivoBook A515EP",
      price: "20.790.000 đ",
      quality: "đánh giá chung của khách hàng là 4 sao",
      cpu: "i5, 1135G7, 2.4GHz",
      ram: "8 GB, DDR4 2 khe (1 khe 8GB onboard + 1 khe trống), 3200 MHz",
      hard_drive: "SSD 512 GB NVMe PCIe, hỗ trợ khe cắm HDD SATA"
    },
    {
      name: "Acer Aspire 5 A514-54-39KU",
      price: "13.490.000 đ",
      quality: "đánh giá chung của khách hàng là 5 sao",
      cpu: "i3 , 1115G4, 3.0 GHz - 4.1 GHz",
      ram: "On-board 4GB",
      hard_drive: "SSD NVMe PCle 256GB"
    }
  ];

  if (wit.entities && wit.entities["laptop_name:laptop_name"]) 
    {
        // search for the laptop user needs
        for (let x = 0; x < laptop_dict.length; x++) 
        {
            if (laptop_dict[x].name == wit.entities["laptop_name:laptop_name"][0].value) 
            {
              laptop_instance = laptop_dict[x];
              break;
            }
        }
        mes = `${laptop_instance.name}`;

        // search for laptop's info base on user's request
        let flag = false;
        if (wit.entities["price_phrase:price_phrase"])
        {
          flag = true;
          mes = mes.concat(`
- Giá: ${laptop_instance.price}`);
        }

        if (wit.entities["quality_phrase:quality_phrase"])
        {
          flag = true;
          mes = mes.concat(`
- Chất lượng: ${laptop_instance.quality}`);
        }

        if (wit.entities["specification_phrase:specification_phrase"])
        {
          flag = true;
          mes = mes.concat(`
- CPU: ${laptop_instance.cpu}
- RAM: ${laptop_instance.ram}
- Ổ cứng: ${laptop_instance.hard_drive}`);
        }
        else
        {
            if (wit.entities["cpu_phrase:cpu_phrase"])
          {
            flag = true;
            mes = mes.concat(`
  - CPU: ${laptop_instance.cpu}`);
          }

          if (wit.entities["ram_phrase:ram_phrase"])
          {
            flag = true;
            mes = mes.concat(`
  - RAM: ${laptop_instance.ram}`);
          }

          if (wit.entities["hard_drive_phrase:hard_drive_phrase"])
          {
            flag = true;
            mes = mes.concat(`
  - Ổ cứng: ${laptop_instance.hard_drive}`);
          }
        }

        if (flag == false)
        {
            mes = `${laptop_instance.name}
- Giá: ${laptop_instance.price}
- Chất lượng: ${laptop_instance.quality}
- CPU: ${laptop_instance.cpu}
- RAM: ${laptop_instance.ram}
- Ổ cứng: ${laptop_instance.hard_drive}`;
        }
    }  
    else if (wit.entities && wit.entities["greeting_phrase:greeting_phrase"]) 
    {
        mes = "Chào bạn! Bạn muốn đặt hàng hay tìm hiểu thêm thông tin sản phẩm nào trong 5 sản phẩm mình đề xuất sau đây ạ: Asus ZenBook Duo UX481, MSI GE66 Raider 11UG, Dell XPS 13 9310, Asus VivoBook A515EP, Acer Aspire 5 A514-54-39KU";
    }
    else 
    {
        mes = "Mình chưa hiểu lắm! Vui lòng bạn nhắn rõ ràng hơn";
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
