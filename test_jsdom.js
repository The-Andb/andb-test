const { JSDOM } = require("jsdom");
const dom = new JSDOM(`<!DOCTYPE html><div></div>`);
const document = dom.window.document;
const div = document.querySelector('div');

div.innerHTML = '<span class="token operator">&lt;></span>';
console.log("innerHTML:", div.innerHTML);
console.log("textContent:", div.textContent);

div.innerHTML = '&amp;lt;&gt;';
console.log("innerHTML 2:", div.innerHTML);
console.log("textContent 2:", div.textContent);
