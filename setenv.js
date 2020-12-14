/* eslint-disable camelcase */

const item_reg = /^\s*set\s+([^\s]+)\s*=([\s\S]*)$/im;
const call_reg = /^\s*call\s+([\s\S]+?)\s*$/im;
const env = process.env;
const fs = require("fs");
const path = require("path");
const gbk2utf8 = require("./gbk2utf8");

const file = path.resolve(__dirname, './app/config.bat');
add(file);

function get(v, file) {
  return v
    .replace(/%~dp0/ig, path.join(path.parse(file).dir, "./"))
    .replace(/%.*?%/g, function (match) {
      if (match.length === 2) {
        return "%";
      } else {
        return env[match.slice(1, match.length - 1)];
      }
    });
}

function add(file) {
  gbk2utf8(fs.readFileSync(file))
    .split(/[\r\n]+/g)
    .filter(function (a) {
      return item_reg.test(a) || call_reg.test(a);
    })
    .forEach(function (a) {
      //console.log(a)
      const match = a.match(call_reg);
      if (match) {
        const new_file = get(match[1], file);
        const exts = ["bat", "cmd", "sh"];
        let ext = "";
        do {
          const filename = ext ? new_file + "." + ext : new_file;
          if (fs.existsSync(filename) && fs.statSync(filename).isFile()) {
            return add(filename);
          }
        // eslint-disable-next-line no-cond-assign
        } while (ext = exts.shift());
        return;
      }
      const matchs = a.match(item_reg);
      const key = matchs[1];
      const value = get(matchs[2], file);
      env[key] = value;
    });
}

