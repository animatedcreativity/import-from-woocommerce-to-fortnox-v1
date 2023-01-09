var appConfig = {"mainFile":"main.js","minimal":"v1"};

var app = {
  start: async function() {
    var options = app.parseArgv(["type", "wc-api-url", "wc-consumer-key", "wc-consumer-secret", "fn-api-url", "fn-client-secret", "fn-access-token", "wc-order-number", "console-key", "console-prefix"]);
    console.log(options);
    if (app.has(options) && app.has(options.type) && app.has(app.sync[options.type])) {
      app.cliOptions = options;
      await app.sync[options.type].start(options);
      if (app.has(options.consoleKey)) app.exit(10);
    } else {
      console.log(app.consoleColors.bgRed, "Invalid options: ", options);
    }
  }
};
app.startUps = [];
app.workerStartUps= [];
app.callbacks = {static: []};app["api"] = {"fortnox": (function() {
  var mod = {
    createOrder: async function(options, newFnOrder) {
      var url = options.fnApiUrl + "orders";
      console.log(app.consoleColors.bgBlue, "POST Creating order:", newFnOrder.Order.YourOrderNumber + " " + url);
      var result = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "application/json",
          "Content-Type": "application/json",
          "Access-Token": options.fnAccessToken,
          "Client-Secret": options.fnClientSecret,
        },
        body: JSON.stringify(newFnOrder)
      });
      if (result.status >= 200 && result.status <= 201) {
        return await result.json();
      }
    },
    updateCustomer: async function(options, CustomerNumber, updatedFnCustomer) {
      var url = options.fnApiUrl + "customers/" + CustomerNumber;
      console.log(app.consoleColors.bgBlue, "PUT Updating customer:", updatedFnCustomer.Customer.Email + " " + url);
      var result = await fetch(url, {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "application/json",
          "Content-Type": "application/json",
          "Access-Token": options.fnAccessToken,
          "Client-Secret": options.fnClientSecret,
        },
        body: JSON.stringify(updatedFnCustomer)
      });
      if (result.status >= 200 && result.status <= 201) {
        return await result.json();
      }
    },
    createCustomer: async function(options, newFnCustomer) {
      var url = options.fnApiUrl + "customers";
      console.log(app.consoleColors.bgBlue, "POST Creating customer:", newFnCustomer.Email + " " + url);
      var result = await fetch(url, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "application/json",
          "Content-Type": "application/json",
          "Access-Token": options.fnAccessToken,
          "Client-Secret": options.fnClientSecret,
        },
        body: JSON.stringify(newFnCustomer)
      });
      if (result.status >= 200 && result.status <= 201) {
        return await result.json();
      }
    },
    getCustomers: async function(options, email) {
      var url = options.fnApiUrl + "customers?email=" + email;
      console.log(app.consoleColors.bgBlue, "Getting customer:", email + " " + url);
      var result = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "application/json",
          "Content-Type": "application/json",
          "Access-Token": options.fnAccessToken,
          "Client-Secret": options.fnClientSecret,
        }
      });
      if (result.status === 200) {
        var json = await result.json();
        return json.Customers;
      }
    }
  };
  return mod;
})(), "woo": (function() {
  var mod = {
    updateOrder: async function(options, order) {
      var url = options.wcApiUrl + "/orders/" + order.id;
      console.log(app.consoleColors.bgBlue, "Updating order:", order.id + " " + url);
      var result = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": "Basic " + Buffer.from(options.wcConsumerKey + ":" + options.wcConsumerSecret).toString('base64'),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(order)
      });
      if (result.status === 200) {
        return await result.json();
      }
      return false;
    },
    list: async function(options, page, key) {
      var fetchAll = !app.has(page) || page > 1;
      if (!app.has(page)) page = 1;
      var url = options.wcApiUrl + "/" + key + "s?page=" + page + "&per_page=100";
      console.log(app.consoleColors.bgBlue, "Fetching " + key + " page:", page + " " + url);
      var result = await fetch(url, {
        headers: {
          "Authorization": "Basic " + Buffer.from(options.wcConsumerKey + ":" + options.wcConsumerSecret).toString('base64'),
          "Content-Type": "application/json"
        }
      });
      if (result.status === 200) {
        var items = await result.json();
        if (items.length < 100 || fetchAll !== true) {
          return items;
        } else {
          var moreItems = await mod.list(options, page + 1, key);
          return app.has(moreItems) ? items.concat(moreItems) : undefined;
        }
      }
    },
    updateProduct: async function(options, product) {
      var url = options.wcApiUrl + "/products/" + product.id;
      console.log(app.consoleColors.bgBlue, "Updating product:", (app.has(product.sku) ? product.sku : product.id) + " " + url);
      var result = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": "Basic " + Buffer.from(options.wcConsumerKey + ":" + options.wcConsumerSecret).toString('base64'),
          "Content-Type": "application/json"
        },
        body: JSON.stringify(product)
      });
      if (result.status === 200) {
        return true;
      }
      return false;
    },
    getLoadedProduct: function(list, key, value) {
      var filtered = [];
      for (var i=0; i<=list.length-1; i++) {
        var product = list[i];
        if (app.has(product[key]) && product[key] === value) {
          filtered.push(product);
        }
      }
      if (filtered.length === 0) return;
      if (filtered.length === 1) return filtered[0];
      return filtered;
    },
    getProduct: async function(options, sku) {
      var url = options.wcApiUrl + "/products?sku=" + sku;
      console.log(app.consoleColors.bgBlue, "Fetching product:", sku + " " + url);
      var result = await fetch(url, {
        headers: {
          "Authorization": "Basic " + Buffer.from(options.wcConsumerKey + ":" + options.wcConsumerSecret).toString('base64'),
          "Content-Type": "application/json"
        }
      });
      if (result.status === 200) {
        var json = await result.json();
        if (json.length > 0) return json[0];
      }
    },
    getProducts: async function(options, page) {
      return await mod.list(options, page, "product");
    },
    getOrders: async function(options, page) {
      return await mod.list(options, page, "order");
    }
  };
  return mod;
})(), };app["build"] = {};app["enhance"] = {"argv": (function() {
  var mod = {
    start: function() {
      app.parseArgv = function(list) {
        var options = {};
        for (var i=2; i<=process.argv.length-1; i++) {
          var option = process.argv[i];
          var name = option.split("=").shift().trim();
          var cName = app.camelCase(name).split("-").join("");
          var value = option.split("=").pop().trim();
          if (list.indexOf(name) >= 0) {
            options[cName] = value;
          } else {
            console.log(app.consoleColors.bgRed, "Invalid option: " + name);
            return;
          }
        }
        app.cliOptions = options;
        return options;
      };
    }
  };
  mod.start();
  return mod;
})(), "console": (function() {
  var mod = {
    logged: false,
    start: function() {
      app.console = function() {
        if (app.has(app.cliOptions) && app.has(app.cliOptions.consoleKey)) {
          if (!app.has(mod.consoleRe)) {
            mod.consoleRe = require('console-remote-client').connect({server: "https://console.ylo.one:8088", channel: app.cliOptions.consoleKey});
          }
          var args = Array.prototype.slice.call(arguments);
          if (app.has(app.cliOptions.consolePrefix)) {
            args.unshift("[lime]" + app.cliOptions.consolePrefix + "[/lime]");
          }
          console.log(args);
          console.re.log.apply(null, args);
          mod.logged = true;
        }
      };
      app.exit = async function(time) {
        if (mod.logged === true) {
          console.log("Waiting for remote console...");
          if (!app.has(time)) time = 5; // 5 seconds
          await new Promise(function(resolve, reject) {
            setTimeout(function() { resolve(true); }, time * 1000);
          });
        }
        process.exit();
      };
      app.consoleColors = {
        reset: "\x1b[0m%s\x1b[0m",
        bright: "\x1b[1m%s\x1b[0m",
        dim: "\x1b[2m%s\x1b[0m",
        underscore: "\x1b[4m%s\x1b[0m",
        blink: "\x1b[5m%s\x1b[0m",
        reverse: "\x1b[7m%s\x1b[0m",
        hidden: "\x1b[8m%s\x1b[0m",
        fgBlack: "\x1b[30m%s\x1b[0m",
        fgRed: "\x1b[31m%s\x1b[0m",
        fgGreen: "\x1b[32m%s\x1b[0m",
        fgYellow: "\x1b[33m%s\x1b[0m",
        fgBlue: "\x1b[34m%s\x1b[0m",
        fgMagenta: "\x1b[35m%s\x1b[0m",
        fgCyan: "\x1b[36m%s\x1b[0m",
        fgWhite: "\x1b[37m%s\x1b[0m",
        fgGray: "\x1b[90m%s\x1b[0m",
        bgBlack: "\x1b[40m%s\x1b[0m",
        bgRed: "\x1b[41m%s\x1b[0m",
        bgGreen: "\x1b[42m%s\x1b[0m",
        bgYellow: "\x1b[43m%s\x1b[0m",
        bgBlue: "\x1b[44m%s\x1b[0m",
        bgMagenta: "\x1b[45m%s\x1b[0m",
        bgCyan: "\x1b[46m%s\x1b[0m",
        bgWhite: "\x1b[47m%s\x1b[0m",
        bgGray: "\x1b[100m%s\x1b[0m"
      };
    }
  };
  mod.start();
  return mod;
})(), "string": (function() {
  var mod = {
    start: function() {
      app.camelCase = function camelize(str, capitalFirst) {
        if (!app.has(capitalFirst)) capitalFirst = false;
        var result = str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
        if (capitalFirst) result = result.substr(0, 1).toUpperCase() + result.substr(1, 999);
        return result;
      };
      app.properCase = function(str) {
        return str.replace(
          /\w\S*/g,
          function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); }
        );
      };
    }
  };
  mod.start();
  return mod;
})(), };app["publish"] = {};app["sync"] = {"order": (function() {
  var mod = {
    metaData: function(wooOrder, key) {
      if (typeof wooOrder.meta_data !== "undefined" && wooOrder.meta_data !== null) {
        for (var i=0; i<=wooOrder.meta_data.length-1; i++) {
          var obj = wooOrder.meta_data[i];
          if (obj.key === key) return obj.value;
        }
      }
    },
    start: async function(options) {
      if (
        app.has(options.wcApiUrl)
        && app.has(options.wcConsumerKey)
        && app.has(options.wcConsumerSecret)
        && app.has(options.fnApiUrl)
        && app.has(options.fnAccessToken)
        && app.has(options.fnClientSecret)
      ) {
        var domain = app.utils.url.domain(options.wcApiUrl);
        var wooOrders = await app.api.woo.getOrders(options);
        for (var i=0; i<=wooOrders.length-1; i++) {
          var wooOrder = wooOrders[i];
          if (wooOrder.status !== "processing") continue;
          if ((!app.has(options.wcOrderNumber)
              || (
                app.has(options.wcOrderNumber)
                && wooOrder.number == options.wcOrderNumber
            ))
            && wooOrder.billing.email.trim().toLowerCase().split("abbuzz.com").length <= 1
          ) {
            if (String(wooOrder.shipping.company).toLowerCase().split(" ").join("") === "klickahär" || String(wooOrder.shipping.company).toLowerCase().split(" ").join("") === "klickahar"
            ) { wooOrder.shipping.company = ""; }
            if (String(wooOrder.billing.company).toLowerCase().split(" ").join("") === "klickahär" || String(wooOrder.billing.company).toLowerCase().split(" ").join("") === "klickahar"
            ) { wooOrder.billing.company = ""; }
            var invoiceEmail = mod.metaData(wooOrder, "_billing_invoice_email");
            if (typeof invoiceEmail !== "string") invoiceEmail = "";
            var fnCustomers = await app.api.fortnox.getCustomers(options, wooOrder.billing.email);
            if (app.has(fnCustomers)) {
              var vatNumber = mod.metaData(wooOrder, "vat_number");
              if (Object.keys(fnCustomers).length <= 0) {
                var newFnCustomer = {
                  "Customer": {
                    "Active": true,
                    "Address1": wooOrder.billing.address_1,
                    "Address2": wooOrder.billing.address_2,
                    "City": wooOrder.billing.city,
                    "CountryCode": wooOrder.billing.country,
                    "Currency": wooOrder.currency,
                    "DeliveryAddress1": wooOrder.shipping.address_1,
                    "DeliveryAddress2": wooOrder.shipping.address_2,
                    "DeliveryCity": wooOrder.shipping.city,
                    "DeliveryCountryCode": wooOrder.shipping.country,
                    "DeliveryName": (function() {
                      if (typeof wooOrder.shipping.company !== "undefined" && wooOrder.shipping.company !== null && wooOrder.shipping.company.trim() !== "") {
                        return String(wooOrder.shipping.company).trim();
                      } else {
                        return String(wooOrder.shipping.first_name + " " + wooOrder.shipping.last_name).trim();
                      }
                    })(),
                    "DeliveryZipCode": wooOrder.shipping.postcode,
                    "Email": wooOrder.billing.email,
                    "EmailInvoice": invoiceEmail !== "" ? invoiceEmail : wooOrder.billing.email,
                    "EmailOffer": wooOrder.billing.email,
                    "EmailOrder": wooOrder.billing.email,
                    "Name": (function() {
                      if (typeof wooOrder.billing.company !== "undefined" && wooOrder.billing.company !== null && wooOrder.billing.company.trim() !== "") {
                        return String(wooOrder.billing.company).trim();
                      } else {
                        return String(wooOrder.billing.first_name + " " + wooOrder.billing.last_name).trim();
                      }
                    })(),
                    "OrganisationNumber": typeof vatNumber === "string" && vatNumber !== "" ? vatNumber.split("SE").join("").split("se").join("").split("-").join("") : "",
                    "OurReference": domain,
                    "Phone1": wooOrder.billing.phone,
                    "ZipCode": wooOrder.billing.postcode,
                    "YourReference": String(wooOrder.billing.first_name + " " + wooOrder.billing.last_name).trim(),
                    TermsOfDelivery: "FVL",
                    TermsOfPayment: (wooOrder.payment_method === "cod" ? "30" : (wooOrder.payment_method === "stripe" ? "KK" : "FS")),
                    WayOfDelivery: (function() {
                      if (typeof vatNumber === "string" && vatNumber.trim() !== "") return "SCH";
                      return "P";
                    })(),
                  }
                };
                newFnCustomer.Customer.Email = newFnCustomer.Customer.Email.toLowerCase();
                var fnCustomer = await app.api.fortnox.createCustomer(options, newFnCustomer);
                if (app.has(fnCustomer)) {
                  console.log(app.consoleColors.bgMagenta, "Added new customer to Fortnox: " + wooOrder.billing.email);
                } else {
                  console.log(app.consoleColors.bgRed, "Could not add new customer to Fortnox: " + wooOrder.billing.email);
                  continue;
                }
              }
              var fnCustomers = await app.api.fortnox.getCustomers(options, wooOrder.billing.email);
              if (app.has(fnCustomers) && fnCustomers.length > 0) {
                var fnCustomer = fnCustomers[0];
                var updatedFnCustomer = {
                  "Customer": {
                    "Active": true,
                    "Address1": wooOrder.billing.address_1,
                    "Address2": wooOrder.billing.address_2,
                    "City": wooOrder.billing.city,
                    "CountryCode": wooOrder.billing.country,
                    "Currency": wooOrder.currency,
                    "DeliveryAddress1": wooOrder.shipping.address_1,
                    "DeliveryAddress2": wooOrder.shipping.address_2,
                    "DeliveryCity": wooOrder.shipping.city,
                    "DeliveryCountryCode": wooOrder.shipping.country,
                    "DeliveryName": (function() {
                      if (typeof wooOrder.shipping.company !== "undefined" && wooOrder.shipping.company !== null && wooOrder.shipping.company.trim() !== "") {
                        return String(wooOrder.shipping.company).trim();
                      } else {
                        return String(wooOrder.shipping.first_name + " " + wooOrder.shipping.last_name).trim();
                      }
                    })(),
                    "DeliveryZipCode": wooOrder.shipping.postcode,
                    "Email": wooOrder.billing.email,
                    "EmailInvoice": invoiceEmail !== "" ? invoiceEmail : wooOrder.billing.email,
                    "EmailOffer": wooOrder.billing.email,
                    "EmailOrder": wooOrder.billing.email,
                    "Name": (function() {
                      if (typeof wooOrder.billing.company !== "undefined" && wooOrder.billing.company !== null && wooOrder.billing.company.trim() !== "") {
                        return String(wooOrder.billing.company).trim();
                      } else {
                        return String(wooOrder.billing.first_name + " " + wooOrder.billing.last_name).trim();
                      }
                    })(),
                    // "OrganisationNumber": typeof vatNumber === "string" && vatNumber !== "" ? vatNumber.split("SE").join("").split("se").join("").split("-").join("") : "",
                    "OurReference": domain,
                    "Phone1": wooOrder.billing.phone,
                    "ZipCode": wooOrder.billing.postcode,
                    "YourReference": String(wooOrder.billing.first_name + " " + wooOrder.billing.last_name).trim(),
                    TermsOfDelivery: "FVL",
                    TermsOfPayment: (wooOrder.payment_method === "cod" ? "30" : (wooOrder.payment_method === "stripe" ? "KK" : "FS")),
                    WayOfDelivery: (function() {
                      if (typeof vatNumber === "string" && vatNumber.trim() !== "") return "SCH";
                      return "P";
                    })(),
                  }
                };
                var updateResult = await app.api.fortnox.updateCustomer(options, fnCustomer.CustomerNumber, updatedFnCustomer);
                if (app.has(updateResult)) {
                  console.log(app.consoleColors.bgMagenta, "Updated Customer: " + wooOrder.billing.email);
                  var freight = 0;
                  for (var k=0; k<=wooOrder.shipping_lines.length-1; k++) freight += Number(wooOrder.shipping_lines[k].total);
                  var freightVAT = 0;
                  for (var k=0; k<=wooOrder.shipping_lines.length-1; k++) freightVAT += Number(wooOrder.shipping_lines[k].total_tax);
                  var vatPercent = 0;
                  for (var k=0; k<=wooOrder.tax_lines.length-1; k++) vatPercent = wooOrder.tax_lines[k].rate_percent;
                  if (vatPercent > 0) vatPercent = 25;
                  var fnOrder = {
                    Order: {
                      CustomerNumber: fnCustomer.CustomerNumber,
                      AdministrationFee: 0,
                      Address1: wooOrder.billing.address_1,
                      Address2: wooOrder.billing.address_2,
                      City: wooOrder.billing.city,
                      Comments: wooOrder.customer_note.split("☺").join(""),
                      CopyRemarks: true,
                      Country: wooOrder.billing.country === "SE" ? "Sverige" : "",
                      CostCenter: '',
                      Currency: wooOrder.currency,
                      CurrencyRate: 1, // 1 / $order->currate;
                      // if (isset($order->curunit)) $fn3_order->Order->CurrencyUnit = $order->curunit;
                      CustomerName: (function() {
                        if (typeof wooOrder.billing.company !== "undefined" && wooOrder.billing.company !== null && wooOrder.billing.company.trim() !== "") {
                          return String(wooOrder.billing.company).trim();
                        } else {
                          return String(wooOrder.billing.first_name + " " + wooOrder.billing.last_name).trim();
                        }
                      })(),
                      DeliveryAddress1: wooOrder.shipping.address_1,
                      DeliveryAddress2: wooOrder.shipping.address_2,
                      DeliveryCity: wooOrder.shipping.city,
                      DeliveryCountry: wooOrder.shipping.country === "SE" ? "Sverige" : "",
                      // $fn3_order->Order->DeliveryDate = $order->ddate;
                      DeliveryName: (function() {
                        if (typeof wooOrder.shipping.company !== "undefined" && wooOrder.shipping.company !== null && wooOrder.shipping.company.trim() !== "") {
                          return String(wooOrder.shipping.company).trim();
                        } else {
                          return String(wooOrder.shipping.first_name + " " + wooOrder.shipping.last_name).trim();
                        }
                      })(),
                      DeliveryZipCode: wooOrder.shipping.postcode,
                      DocumentNumber: "",
                      EmailInformation: {
                        EmailAddressFrom: "",
                        EmailAddressTo: "",
                        EmailAddressCC: "",
                        EmailAddressBCC: "",
                        EmailSubject: "",
                        EmailBody: ""
                      },
                      ExternalInvoiceReference1: "",
                      ExternalInvoiceReference2: "",
                      Freight: 0, // freight,
                      HouseWork: false,
                      Language: "SV", //overriding language to swedish for now as DK is not found.
                      NotCompleted: false,
                      OfferReference: '',
                      OrderDate: wooOrder.date_created.split("T").shift(),
                      "OrganisationNumber": typeof vatNumber === "string" && vatNumber !== "" ? vatNumber.split("SE").join("").split("se").join("").split("-").join("") : "",
                      OurReference: domain,
                      Phone1: wooOrder.billing.phone,
                      Phone2: "",
                      PriceList: "A",
                      PrintTemplate: "",
                      Project: "",
                      // $fn3_order->Order->Remarks = $order->remark;
                      Sent: false,
                      TaxReduction: "",
                      TermsOfDelivery: freight > 0 ? "FVL" : "FK",
                      TermsOfPayment: (wooOrder.payment_method === "cod" ? "30" : (wooOrder.payment_method === "stripe" ? "KK" : "FS")),
                      VATIncluded: false,
                      WayOfDelivery: (function() {
                        if (typeof vatNumber === "string" && vatNumber.trim() !== "") return "SCH";
                        return "P";
                      })(),
                      YourOrderNumber: wooOrder.number,
                      ZipCode: wooOrder.billing.postcode,
                      OrderRows: await (async function() {
                        var products = [];
                        for (var k=0; k<=wooOrder.line_items.length-1; k++) {
                          var wooOrderProduct = wooOrder.line_items[k];
                          products.push({
                            ArticleNumber: wooOrderProduct.sku,
                            CostCenter: "",
                            DeliveredQuantity: wooOrderProduct.quantity,
                            Description: wooOrderProduct.name.split("~").join("-"),
                            Discount: 0,
                            DiscountType: "AMOUNT",
                            HouseWork: false,
                            HouseWorkHoursToReport: "",
                            HouseWorkType: "",
                            OrderedQuantity: wooOrderProduct.quantity,
                            Price: Math.round(wooOrderProduct.price),
                            Project: "",
                            Unit: "st",
                            VAT: vatPercent
                          });
                        }
                        products.push({
                          ArticleNumber: "100075",
                          CostCenter: "",
                          DeliveredQuantity: 1,
                          Description: "Frakt Std",
                          Discount: 0,
                          DiscountType: "AMOUNT",
                          HouseWork: false,
                          HouseWorkHoursToReport: "",
                          HouseWorkType: "",
                          OrderedQuantity: 1,
                          Price: freight,
                          Project: "",
                          Unit: "st",
                          VAT: vatPercent
                        });
                        return products;
                      })()
                    }
                  };
                  var fnOrderResult = await app.api.fortnox.createOrder(options, fnOrder);
                  if (app.has(fnOrderResult)) {
                    var wooOrderResult = await app.api.woo.updateOrder(options, {id: wooOrder.id, status: "completed"});
                    if (app.has(wooOrderResult)) {
                      console.log(app.consoleColors.bgMagenta, "Order synced to Fortnox: " + wooOrder.number + " > " + fnOrderResult.Order.DocumentNumber);
                      app.console("[blue]Order synced to Fortnox:[/blue]", wooOrder.number + " > " + fnOrderResult.Order.DocumentNumber);
                    }
                  } else {
                    console.log(app.consoleColors.bgRed, "Order could not be synced to Fortnox: " + wooOrder.number);
                    app.console("[red]Order could not be synced to Fortnox:[/red]", wooOrder.number);
                  }
                } else {
                  console.log(app.consoleColors.bgRed, "Could not update customer: " + wooOrder.billing.email);
                  app.console("[red]Could not update customer:[/red]", wooOrder.billing.email);
                }
              } else {
                console.log(app.consoleColors.bgRed, "Could not load Fortnox customers: " + wooOrder.billing.email);
              }
            } else {
              console.log(app.consoleColors.bgRed, "Could not load Fortnox customers: " + wooOrder.billing.email);
            }
          }
        }
      } else {
        console.log(app.consoleColors.bgRed, "Invalid/Missing options:", options);
      }
    }
  };
  return mod;
})(), };app["utils"] = {"url": (function() {
  var mod = {
    domain: function(link) {
      return new URL(link).hostname;
    }
  };
  return mod;
})(), };
var config = app.config;
var modules = app.modules;
app.has = function(value) {
  var found = true;
  for (var i=0; i<=arguments.length-1; i++) {
    var value = arguments[i];
    if (!(typeof value !== "undefined" && value !== null && value !== "")) found = false;
  }
  return found;
};
if (!app.has(fetch)) {
  var fetch = require("node-fetch");
}
if (typeof app.start === "function") app.start();
