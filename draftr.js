/*

This file provides tools to convert among the various representations of RFCs
* Markdown
* XML
* Text

The initial goal is to convert from Markdown to text, but the vision is to be
able to parse any of the three into an AST (possibly with some imprecision for
text), and render into any of the three.

A document is represented at the top level by a JS object of the following
form:

{
  "meta": { ... },
  "abstract": "...",
  "blocks": [ ... ]
}

The "meta" element of a document contains metadata in the same format as the
YAML block at the top of a kramdown-xml2rfc file.  The "abstract" element is
simply the document's abstract as a string.  The "blocks" element contains
a sequence of blocks, in roughly the same sense as Commonmark uses.  The main
difference is that in addition to the container blocks defined in Commonmark,
we also allow section blocks to act as containers.

The types of block are as follows:
 // TODO

Dependencies:
* http://yamltojson.com/js/yaml.js


*/

function fromMD(text) {
  // XXX This is a partial implementation
  var AST = {
    meta: {},
    abstract: "",
    blocks: []
  };

  var lines = text.split("\n");
  var divider = lines[0];
  var sectionStart = 0, sectionEnd = 1;
  for (sectionEnd=1; sectionEnd<lines.length; ++sectionEnd)
    if (lines[sectionEnd].indexOf(divider) == 0)
      break;

  // The metadata is always the top section
  var metaText = lines.slice(sectionStart+1, sectionEnd).join("\n");
  AST.meta = YAML.parse(metaText);

  while (sectionEnd < lines.length) {
    sectionStart = sectionEnd;
    for (sectionEnd += 1; sectionEnd < lines.length; ++sectionEnd)
      if (lines[sectionEnd].indexOf(divider) == 0)
        break;

    if (lines[sectionStart].indexOf("abstract", divider.length) > -1) {
      var abstractText = lines.slice(sectionStart+1, sectionEnd).join(" ");
      abstractText = abstractText.replace(/[ ]+/, " ")
                                 .replace(/^[ ]*/, "")
                                 .replace(/[ ]*$/, "");
      AST.abstract = abstractText;
    } else if (lines[sectionStart].indexOf("middle", divider.length) > -1) {
      AST.blocks = lines.slice(sectionStart+1, sectionEnd);
      // TODO: Parse MD over middle
    } // Other types of top-level section unsupported
  }

  console.log(AST)

  return AST;
}

function toMD(ast) {
  throw "Not implemented";
}

function fromXML(text) {
  throw "Not implemented";
}

function toXML(ast) {
  throw "Not implemented";
}

function fromTXT(text) {
  throw "Not implemented";
}

function toTXT(ast) {
  // XXX This is a bogus implementation
  console.log(ast);
  return JSON.stringify(ast, null, 2);
}
