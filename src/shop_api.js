Storage.prototype.setObject = function (key, value) {
    this.setItem(key, JSON.stringify(value));
};
Storage.prototype.getObject = function (key) {
    var value = this.getItem(key);
    if (value == undefined) return [];
    return value && JSON.parse(value);
};

function consoleOut(function_name, message) {
    if (debug == true) {
        console.log(function_name + "> " + message);
    }
}

function isArrayEmpty(array) {
    if (Array.isArray(array) && array.length) {
        return false;
    } else {
        return true;
    }
}

function sortJsonDB(result, sort) {
    var param = sort.split(":");
    if (param[0] == 'date') {
        if (param[1] == 'asc') {
            result.sort(function (x, y) {
                let a = new Date(x.date),
                    b = new Date(y.date);
                return a - b;
            });
        } else if (param[1] == 'desc') {
            result.sort(function (x, y) {
                let a = new Date(x.date),
                    b = new Date(y.date);
                return b - a;
            });
        }
    } else if (param[0] == 'id') {
        if (param[1] == 'asc') {
            result.sort(function (x, y) {
                let a = x.id,
                    b = y.id;
                return a - b;
            });
        } else if (param[1] == 'desc') {
            result.sort(function (x, y) {
                let a = x.id,
                    b = y.id;
                return b - a;
            });
        }
    } else if (param[0] == 'price') {
        if (param[1] == 'asc') {
            result.sort(function (x, y) {
                return x.price - y.price;
            });
        } else if (param[1] == 'desc') {
            result.sort(function (x, y) {
                return y.price - x.price;
            });
        }
    } else if (param[0] == 'price_cut') {
        var result_old = result;
        result = [];
        Object.entries(result_old).map((data) => {
            if (data[1].price < (param[1] - 1)) {
                result.push(data[1]);
            }
        });
    } else if (param[0] == 'sale') {
        var result_old = result;
        result = [];
        Object.entries(result_old).map((data) => {
            if (data[1].price_old != '') {
                result.push(data[1]);
            }
        });
    }
    return result;
}

function jsonDBQuery(query = {}, result = []) {
    consoleOut("jsonDBQuery", "Запрос: " + JSON.stringify(query));
    var tags = [];
    var id = null;
    if (typeof query.category !== "undefined" && query.category != '') {
        var tags = query.category.split(",");
    }
    if (typeof query.id !== "undefined" && query.id != '') {
        var id = query.id;
    }
    Object.entries(localStorage.getObject("db").items).map((data) => {
        if (!isArrayEmpty(tags)) {
            var counter = 0;
            tags.forEach(function (tag) {
                data[1].tags.forEach(function (category) {
                    if (category == tag) {
                        counter = counter + 1;
                    }
                });
            });
            if (counter == tags.length) {
                result.push(data[1]);
            }
        } else if (isArrayEmpty(tags) && id != null && data[1].id == id) {
            result.push(data[1]);
        } else if (isArrayEmpty(tags) && id == null) {
            result.push(data[1]);
        }
    });
    if ("sort" in query && query.sort != "") {
        result = sortJsonDB(result, query.sort);
    }
    return result;
}

function getParams() {
    // /[?&]([^=#]+)=([^&#]*)/g
    var regex = /[?&]([^=#]+)/g,
        url = window.location.href,
        params = {},
        match;
    while ((match = regex.exec(url))) {
        params[match[1]] = match[2];
    }
    return params;
}

function is_in(key, id) {
    var result = false;
    data = localStorage.getObject(key);
    Object.entries(data).map((obj) => {
        if (obj[1] == id) {
            result = true;
        }
    });
    return result;
}

function saveTo(key = "history", item) {
    consoleOut("saveTo", "Сохраняем: " + item);
    if (is_in(key, item) == false) {
        data = localStorage.getObject(key);
        data.push(item);
        localStorage.setObject(key, data);
    }
}

function deleteFrom(key, id) {
    consoleOut("deleteFrom", "Удаляем: " + id);
    data = localStorage.getObject(key);
    for (let [key, value] of Object.entries(data)) {
        if (value == id) {
            data[key] = undefined;
            data = JSON.parse(JSON.stringify(data));
        }
    }
    data = removeFalsy(data);
    localStorage.setObject(key, data);
}

function loadFrom(key) {
    var result = [];
    consoleOut("loadFrom", "Просмотр: " + key);
    data = localStorage.getObject(key);
    for (let key in data) {
        var out = jsonDBQuery({
            id: data[key]
        });
        result.push(out[0]);
    }
    return result;
}

function returnToRoot() {
    var port = '';
    if (window.location.port != '') {
        port = ':' + window.location.port;
    }
    window.location = window.location.protocol + '//' + window.location.hostname + port;
}

function fillCategoryMenu() {
    consoleOut("fillCategoryMenu", "Выгрузка категорий...");
    var category_menu = '';
    var output = [];
    var special_offers = [];
    var special_offers_output = '';
    localStorage.getObject("db").categories.forEach(function (data, index) {
        if (data.category != 'услуги') {
            data.offers.forEach(function (element) {
                if (element != 'sale') {
                    var parts = element.split(':');
                    special_offers.push([data.name + ' до ' + parts[1] + ' руб.', element, data.category, data.image]);
                } else {
                    special_offers.push([data.name + ' со скидкой', element, data.category, data.image]);
                }

            });
            var products = jsonDBQuery({
                category: data.category,
                sort: 'date:desc'
            });
            var counter = localStorage.getObject("db").info.new_products;
            if (products.length < localStorage.getObject("db").info.new_products) {
                counter = products.length;
            }
            for (var i = 0; i < counter; i++) {
                output.push(products[i]);
            }
        }


        var checked = '';
        if (index == 0) {
            checked = 'checked="checked"';
        }
        var category = data.category;
        category_menu = category_menu + '<input id="tab_' +
            index + '" type="radio" name="tabs" ' + checked + ' data-category="' + category + '"><label for="tab_' +
            index + '">' +
            data.name + '</label><div class="tab"><div class="swiper-container" id="subtab_' +
            index + '"><div class="swiper-wrapper">';
        //style="background-image: url(' + "'" + 'https://t3.ftcdn.net/jpg/01/07/71/96/160_F_107719660_z5Zc1u4Mg5lQXHOS4paJLvtY79gpviak.jpg' + "'" + ')"
        data.subcategories.forEach(function (subdata) {
            if (subdata.category != '') {
                category = data.category + "," + subdata.category;
            }
            category_menu = category_menu + '<div class="swiper-slide" data-category="' + category + '"><div class="content"><div class="image"><div class="icon" style="background-image: url(' + "'" + subdata.icon + "'" + ')"></div></div><div class="text">' + subdata.name + '</div></div></div>';
        });
        category_menu = category_menu + '</div></div></div>';
    });
    var new_products = '';
    output.forEach(function (data) {
        var image = '';
        if (data.images.length > 0) {
            image = data.images[0];
        }
        new_products = new_products + '<div class="swiper-slide"><div class="content" data-id="' + data.id + '"><div class="image" style="background-image: url(' + image + ')"><div class="overlay">&#x20bd; ' + data.price + '</div></div><div class="text">' + data.name + '</div></div></div>';
    });
    special_offers.forEach(function (data) {
        special_offers_output = special_offers_output + '<a href="#models" class="swiper-slide" data-category="' + data[2] + '" data-sort="' + data[1] + '" style="background-image: url(' + "'" + data[3] + "'" + ')">' + data[0] + '</a>';
    });
    document.querySelector("#new_products .swiper-wrapper").innerHTML = new_products;
    document.querySelector("#special-offers .swiper-wrapper").innerHTML = special_offers_output;
    document.querySelectorAll("#new_products .swiper-wrapper .swiper-slide .content").forEach(function (element) {
        element.addEventListener("click", () => {
            openmodal('m_product', element.dataset.id);
        });
    });
    document.querySelectorAll("#special-offers .swiper-wrapper .swiper-slide").forEach(function (element) {
        if (element.dataset.category != 'услуги') {
            element.addEventListener("click", () => {
                location.hash = "#models";
                fillProducts(element.dataset.category, element.dataset.sort);
            });
        }
    });
    var swiper1s = new Swiper("#new_products", {
        clickable: true,
        centeredSlides: true,
        grabCursor: true,
        slidesPerView: 'auto',
        spaceBetween: 5,
    });
    var swiper2s = new Swiper("#special-offers", {
        clickable: true,
        centeredSlides: true,
        grabCursor: true,
        slidesPerView: 'auto',
        spaceBetween: 30,
    });
    $("#category > .tabs").html(category_menu);
    var tabs = document.querySelectorAll(".tabs > input");
    tabs.forEach(function (element, index) {
        var lastactive = 0;
        var do_show = true;
        var sliders = document.querySelectorAll("#subtab_" + index + " > .swiper-wrapper .swiper-slide");

        var swiper = new Swiper("#subtab_" + index, {
            freeMode: true,
            clickable: true,
            centeredSlides: true,
            slidesPerView: 'auto',
            spaceBetween: 15,
        });
        //swiper.allowTouchMove(true);
        element.addEventListener('click', () => {
            if (element.dataset.category != 'услуги') {
                fillProducts(sliders[0].dataset.category);
                sliders[lastactive].classList.remove('active');
                swiper.slideTo(0);
                sliders[0].classList.add('active');
                lastactive = 0;
                sliders.forEach(function (element, index) {
                    element.addEventListener("click", () => {
                        sliders[lastactive].classList.remove('active');
                        element.classList.add('active');
                        lastactive = index;
                        location.hash = "#models";
                        fillProducts(element.dataset.category);
                    });
                });
                // swiper.on('slideChange', function (event) {
                //   fillProducts(sliders[swiper.activeIndex].dataset.category);
                // });
                swiper.on('click', function (event) {
                    swiper.slideTo(swiper.clickedIndex);
                });
            }
            swiper.update();
            if (do_show == true) {
                if (window.innerWidth < 480) {
                    setTimeout(function () {
                        swiper.slideNext();
                        setTimeout(function () {
                            swiper.slidePrev();
                        }, 500);
                    }, 500);
                }
                do_show = false;
            }

        });
    });

    tabs[0].click();
}

function fillProducts(category_data, sort_data = 'date:asc') {
    consoleOut("fillProducts", "Выгрузка продуктов...");
    var products = jsonDBQuery({
        category: category_data,
        sort: sort_data
    });
    if (!isArrayEmpty(products)) {
        $(".models").removeClass("empty");
        $(".sort-box select").data("category", category_data);
        document.querySelector(".sort-box").classList.add('show');
        var items = '';
        products.forEach(function (data) {
            var sale = '';
            var icon = 'info small';
            if (data.price_old != '') {
                sale = 'sale';
                icon = 'sale';
            }
            var clicked = '';
            if (is_in('cart', data.id)) {
                clicked = ' clicked';
            }
            if (data.material != '') {
                data.text = data.text + '</br></br>Материал: ' + data.material;
            }
            if (data.color != '') {
                data.text = data.text + '</br>Цвет: ' + data.color;
            }
            items +=
                '<div class="model"><div class="container"><div class="top" data-id="' + data.id + '" style="background-image: url(' +
                data.images[0] +
                ');"></div><div class="bottom' + clicked + '" data-id="' + data.id + '"><div class="left"><div class="details"><h1>' +
                data.name +
                "</h1><p>&#x20bd; " +
                data.price + '<span>' +
                data.price_old + '</span></p></div><div class="buy"><i class="svg-icon cart-add"></i></div></div><div class="right"><div class="done"><i class="svg-icon cart-ok"></i></div>' +
                '<div class="details"><h1>' +
                data.name +
                '</h1><p>В списке</p></div><div class="remove"><i class="svg-icon cart-undo"></i></div></div></div></div>' +
                '<div class="inside ' + sale + '" data-id="' + data.id + '"><div class="icon"><i class="svg-icon cart-' + icon + '"></i></div><div class="contents">' +
                data.text +
                "</div></div></div>";
        });
        $(".models").html(items);
        $(".model .container .top").each(function () {
            $(this).on("click", function () {
                saveTo("history", $(this).data('id'));
                openmodal('m_product', $(this).data('id'));
            });
        });
        document.querySelectorAll(".model .container .bottom")
            .forEach(function (element, index) {

                element.querySelector(".left .buy").addEventListener("click", (event) => {
                    saveTo("cart", element.dataset.id);
                    element.classList.add("clicked");
                });
                element.querySelector(".right .remove")
                    .addEventListener("click", (event) => {
                        deleteFrom("cart", element.dataset.id);
                        element.classList.remove("clicked");
                    });
            });

    } else {
        consoleOut("fillProducts", 'Нечего показывать');
        $(".sort-box").removeClass("show");
        $(".models").addClass("empty");
        $(".models").html('<div class="message"><div class="icon"><i class="svg-icon search big"></i></div><div class="content">В этой категории нет продуктов!</div></div>');
    }
}

function openmodal(modal, productid = '') {
    closemodal();
    document.querySelector(".modal").classList.add('active');
    var modal_window = document.querySelector("#" + modal);
    modal_window.classList.add('show');
    if (window.innerWidth < 768) {
        $("nav").addClass("show");
    }
    if (modal == 'm_cart') {
        renderCartData();
        $(".modal .container .top-bar .name").text('Cписок моделей на примерку');
    } else if (modal == 'm_product') {
        var product_data = jsonDBQuery({
            id: productid
        })[0];
        renderProductData(product_data);
        $(".modal .container .top-bar .add").addClass('visible');
        $(".modal .container .top-bar .name").text(product_data.name);
    } else if (modal == 'm_call') {
        $(".modal .container .top-bar .name").text('Наш адрес');
    } else if (modal == 'category_editor') {
        $(".modal .container .top-bar .name").text('Редактирование категорий');
    } else if (modal == 'model_editor') {
        if (productid != '') {
            $(".modal .container .top-bar .name").text('Редактирование модели');
            var product_data = jsonDBQuery({
                id: productid
            })[0];
            fillModelEditorForm(product_data);
        } else {
            $(".modal .container .top-bar .name").text('Добавление модели');
            fillModelEditorForm();
        }

    } else if (modal == 'offers_editor') {
        $(".modal .container .top-bar .name").text('Редактирование предложений');
    }
    scroller = false;
    document.body.classList.add('modal-open');
}

function closemodal() {
    scroller = true;
    document.querySelector(".modal").classList.remove('active');
    $(".modal .container .top-bar .add").removeClass('visible');
    document.querySelectorAll(".modal .container .content div").forEach(function (element, index) {
        element.classList.remove('show');
    });
    document.body.classList.remove('modal-open');
}

function fillShopInfo() {
    document.querySelector(".promo .message .text").innerText = localStorage.getObject("db").info.title;
    document.querySelector("nav .logo .caption a").innerText = localStorage.getObject("db").info.site_name;
    document.querySelector("nav .logo .phone").innerText = localStorage.getObject("db").info.phone;
    document.querySelector("nav .logo .address").innerText = localStorage.getObject("db").info.address;
}

function is_in(key, id, result = false) {
    Object.entries(localStorage.getObject(key)).map((obj) => {
        if (obj[1] == id) {
            result = true;
        }
    });
    return result;
}

function saveTo(key = "history", item) {
    consoleOut("saveTo", "Сохраняем продукт №: " + item);
    if (!is_in(key, item)) {
        data = localStorage.getObject(key);
        data.push(item);
        localStorage.setObject(key, data);
    }
}

function deleteFrom(key, id, data = []) {
    consoleOut("deleteFrom", "Удаляем продукт №: " + id);
    Object.entries(localStorage.getObject(key)).forEach((element) => {
        if (element[1] != id) {
            data.push(element[1]);
        }
    });
    localStorage.setObject(key, data);
}

function loadFrom(key) {
    var result = [];
    consoleOut("loadFrom", "Просмотр: " + key);
    Object.entries(localStorage.getObject(key)).forEach((element) => {
        result.push(jsonDBQuery({
            id: element[1]
        })[0]);
    });
    return result;
}

function toggleModelButton(id) {
    var models = document.querySelectorAll("#models .models > .model");
    models.forEach(function (element) {
        var bottom = element.querySelector(".bottom");
        if (bottom.dataset.id == id) {
            bottom.classList.toggle('clicked');
        }
    });
}

function toggleAddButton(id, event = false) {

    if (is_in('cart', id)) {
        if (event == true) {
            deleteFrom('cart', id);
            $(".modal .container .top-bar .add").html('<i class="svg-icon cart-add"></i>');
        } else {
            $(".modal .container .top-bar .add").html('<i class="svg-icon cart-undo"></i>');
        }
    } else {
        if (event == true) {
            saveTo("cart", id);
            $(".modal .container .top-bar .add").html('<i class="svg-icon cart-undo"></i>');
        } else {
            $(".modal .container .top-bar .add").html('<i class="svg-icon cart-add"></i>');
        }
    }
}

function renderProductData(data) {
    consoleOut("renderProductData", 'Обработка...');
    toggleAddButton(data.id);
    var image_list = '';

    data.images.forEach(function (image) {
        console.log(image);
        if (image != '') {
            image_list = image_list + '<div class="swiper-slide"><img src="' + image + '"></div>';
        }
    });

    document.querySelector("#m_product_images .swiper-wrapper").innerHTML = image_list;
    var swiper1s = new Swiper("#m_product_images", {
        slidesPerView: 'auto',
        centeredSlides: true,
        effect: 'fade',
        spaceBetween: 30,
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
    $(".modal .container .top-bar .add").data("id", data.id);
}

function showEmptyListMessage() {
    document.querySelector("#m_cart .cart-content .body").innerHTML = '<div class="empty"><i class="svg-icon search big"></i><span>Список пуст</span></div>';
    document.querySelector("#m_cart .cart-content .contact").style.display = 'none';
}

function fillSelectedModels() {
    var data = loadFrom('cart');
    var inserted_list = '<center><table><tr><th scope="col">Номер</th><th scope="col">Наименование</th><th scope="col">Категория</th><th scope="col">Цена</th></tr>';
    console.log(data);
    data.forEach(function (element) {
        inserted_list = inserted_list + '<tr><td>' + element.id + '</td><td>' + element.name + '</td><td>' + element.tags.join(", ") + '</td><td>' + element.price + '</td></tr>'
    });
    console.log(inserted_list)
    $('#cart_list_to_post').val(inserted_list + '</table></center>');
}

function getFullName(category, out = 'Без категории') {
    localStorage.getObject("db").categories.forEach(function (data, index) {
        if (data.category == category) {
            out = data.name;
        }
    });
    return out;
}

function renderCartData() {
    var data = loadFrom('cart');
    consoleOut("renderCartData", 'Обработка...');
    if (data.length == 0) {
        showEmptyListMessage();
    } else {
        var list = '';
        console.log(data);
        data.forEach(function (element) {
            var category = getFullName(element.tags[0]);
            if (element.price_old != '') {
                category = category + ' со скидкой';
            }
            list = list + '<div class="loved-item" data-id="' + element.id + '"><div class="name"><div class="model">' + element.name +
                '</div><div class="description">' + category + '</div></div><div class="price">&#x20bd; ' + element.price +
                '</div><div class="button"><i class="svg-icon cart-undo small"></i></div></div>';
        });
        fillSelectedModels();
        document.querySelector("#m_cart .cart-content .body").innerHTML = list;
        document.querySelector("#m_cart .cart-content .contact").style.display = 'flex';
        var loved_items_selector = document.querySelectorAll("#m_cart .cart-content .body .loved-item");
        loved_items_selector.forEach(function (element, index) {
            element.querySelector('.button').addEventListener("click", (event) => {
                deleteFrom('cart', element.dataset.id);
                toggleModelButton(element.dataset.id);
                loved_items_selector[index].remove();
                fillSelectedModels();
                if (document.querySelectorAll("#m_cart .cart-content .body .loved-item").length == 0) {
                    showEmptyListMessage();
                }
            });
        });
    }
}

function hideLoader() {
    setTimeout(function () {
        $(".loader").removeClass("show");
    }, 1000);
}

async function loadDB(url, callback) {
    (async () => {
        const rawResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        callback(await rawResponse.json());
    })();
}

const debug = false;
var scroller = true;
let shop_json_data;
const shop_db_url = '/db.json';
const shop_main_url = 'https://salon-mos.ru/';


function iteratePopups(objclass = 'triangle-bottom-popup') {
    document.querySelectorAll('.' + objclass).forEach(function (element) {
        var parent = element.parentNode;
        var timer = '';
        parent.addEventListener("mouseenter", (event) => {
            var rect = parent.getBoundingClientRect();
            var top_center = event.clientY - 65 - (event.clientY - rect.top);
            var left_center = rect.left + Math.ceil(parent.offsetWidth / 2);
            var half_popup = Math.ceil(element.offsetWidth / 2);
            element.style.top = top_center + "px";
            element.style.left = (left_center - half_popup) + "px";
            timer = setTimeout(function () {
                element.classList.add("show");
            }, 500);
            imer = setTimeout(function () {
                element.classList.remove("show");
            }, 3000);
        });
        parent.addEventListener("mouseleave", () => {
            clearTimeout(timer);
            element.classList.remove("show");
        });
    });
}


$(document).ready(function () {

    var video_playback = true;
    var point_of_hide = window.innerHeight;
    $(".modal .container .top-bar .add").click(function () {
        toggleAddButton($(this).data("id"), true);
        toggleModelButton($(this).data("id"));
    });
    $(".sort-box select").val('date:asc');
    $("#cb_phone").mask("+7-(000)-000-00-00", {
        placeholder: "+7-(___)-___-__-__",
    });
    $("#p_phone").mask("+7-(000)-000-00-00", {
        placeholder: "+7-(___)-___-__-__",
    });

    var params = getParams();
    if ('callback' in params && params != '') {
        alert('Заявка успешно отправлена');
        returnToRoot();
    } else if ('dressing' in params && params != '') {
        alert('Заявка на примерку успешно отправлена');
        localStorage.setObject("cart", []);
        returnToRoot();
    } else {
        var d = new Date();
        var milliseconds = d.getTime();
        if (localStorage.getItem("timer") === null || milliseconds - localStorage.getItem("timer") > 1800000 || localStorage.getItem("db") === null) {
            localStorage.setItem("timer", milliseconds);
            loadDB(shop_db_url, (data) => {
                localStorage.setObject("db", data);
            });
        }
        var loads = setInterval(function () {
            if (localStorage.getItem("db") !== null) {
                clearInterval(loads);
                $('#cart_redirect').val(shop_main_url + '?dressing');
                $('#callback_redirect').val(shop_main_url + '?callback');
                $(".about-us .content #main").text(localStorage.getObject("db").info.about);
                $("#map_iframe").attr('src', localStorage.getObject("db").info.map_iframe);
                $("#dress_request_text").text(localStorage.getObject("db").info.dress_request);
                $("#call_request_text").text(localStorage.getObject("db").info.call_request);
                fillCategoryMenu();
                fillShopInfo();
                hideLoader();
            }
        }, 10);

        $(".sort-box select").change(function () {
            fillProducts($(this).data("category"), $(this).val());
        });

        $(".turnback").click(function () {
            if (scroller == true) {
                scroller = false;
                $(".mini-modal").addClass("active");
            } else {
                scroller = true;
                $(".mini-modal").removeClass("active");
            }

        });
        /* document.querySelector(".mini-modal #cb_button").addEventListener("click", () => {
          callbackrequest();
        }); */
        $("nav > .menu ul li a").each(function () {
            $(this).click(function () {
                if ($(this).data('action') != undefined) {
                    openmodal($(this).data('action'));
                }
            });
        });
        let timer_menu;
        window.onscroll = function () {
            if (scroller == true) {
                var currentTop = document.documentElement.scrollTop;
                if (currentTop < this.previousTop) {
                    if (currentTop >= 0) {
                        timer_menu = setTimeout(function () {
                            $("nav").addClass("show");
                        }, 500);
                        //$(".turnback").removeClass("show");
                    } else {
                        clearInterval(timer_menu);
                        $("nav").removeClass("show");
                        //$(".turnback").addClass("show");
                    }
                } else {
                    clearInterval(timer_menu);
                    $("nav").removeClass("show");
                    //$(".turnback").addClass("show");
                }
                if (currentTop > point_of_hide) {
                    document.querySelector("#myVideo").pause();
                    $("#myVideo").addClass('fade-out');
                } else if (currentTop <= point_of_hide) {
                    document.querySelector("#myVideo").play();
                    $("#myVideo").removeClass('fade-out');
                }
                this.previousTop = currentTop;
            }
        };
    }
    if (window.innerWidth > 768) {
        iteratePopups();
    }
});