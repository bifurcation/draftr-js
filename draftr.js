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
a sequence of blocks, in roughly the same sense as Commonmark uses.

The types of block are as follows:
* Header
* Text
* Bullet // TODO
* Figure // TODO
* Definition // TODO

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
      blockLines = lines.slice(sectionStart+1, sectionEnd);

      // Split by blank lines and process blocks
      var BLANK_RE = /^\s*$/;
      var SECTION_RE = /^#+ /;
      var UNDERLINE_RE_1 = /^=+$/;
      var UNDERLINE_RE_2 = /^-+$/;
      var currBlock = [];
      for (var i=0; i < blockLines.length; ++i) {
        if (!BLANK_RE.test(blockLines[i])) {
          currBlock.push(blockLines[i]);
          continue;
        }

        // Process currBlock
        if (currBlock.length == 0) {
          continue;
        } else if ((currBlock.length == 1) && SECTION_RE.test(currBlock[0])) {
          // Process section
          var title = currBlock[0].replace(/^#+/, '');
          var level = currBlock[0].length - title.length;
          title = title.replace(/^[ ]*/, '');
          AST.blocks.push({ t: "section", l: level, c: title })
        } else if ((currBlock.length == 2) && UNDERLINE_RE_1.test(currBlock[1])) {
          // Process level-1 header
          AST.blocks.push({ t: "section", l: 1, c: currBlock[0] })
        } else if ((currBlock.length == 2) && UNDERLINE_RE_2.test(currBlock[1])) {
          // Process level-2 header
          AST.blocks.push({ t: "section", l: 2, c: currBlock[0] })
        } else {
          // Process as text
          var text = currBlock.join(" ");
          text = text.replace(/\s+/g, " ");
          AST.blocks.push({ t: "text", c: text });
        }

        currBlock = [];
      }

    } // Other types of top-level section unsupported
  }

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

/*** TXT parsing & rendering ***/

// XXX Surely there's something in JS to do this?
function blank(width) {
  var ret = "";
  while (ret.length < width) { ret += " "; }
  return ret;
}

function wrapText(text, indent, width) {
  if (!indent || !width) {
    return [ text ];
  }

  var tokens = text.split(/\s+/);
  var lines = []
  var tab = blank(indent - 1);

  while (tokens.length > 0) {
    var currLine = tab;

    // Deal with oversized tokens
    if (currLine.length + tokens[0].length + 1 > width) {
      lines.push(currLine + " " + tokens.shift());
    }

    while ((tokens.length > 0) &&
           (currLine.length + tokens[0].length + 1 <= width)) {
      currLine += " " + tokens.shift();
    }
    lines.push(currLine);
  }
  return lines;
}

function insertRightAligned(src, dst) {
  return dst.substr(0, dst.length-src.length) + src;
}

function insertLeftAligned(src, dst) {
  return src + dst.substr(src.length);
}

function insertCentered(src, dst) {
  var start = Math.floor((dst.length - src.length) / 2);
  return dst.substr(0, start) + src + dst.substr(start + src.length);
}

function renderStatus(stat) {
  switch (stat.toLowerCase()) {
    case "std":  return "Standards Track";
    case "info": return "Informational";
    case "exp":  return "Experimental";
    case "bcp":  return "BCP";
  }
  return "Unknown";
}

function addSixMonths(date) {
  var ret = new Date(date);
  ret.setUTCMonth(date.getUTCMonth() + 6);
  if (ret.getUTCMonth() < 6) {
    ret.setUTCFullYear(date.getUTCFullYear() + 1);
  }
  return ret;
}

var months = ["January", "February", "March", "April", "May", "June", "July",
              "August", "September", "October", "November", "December"];
function renderDate(date) {
  return months[date.getUTCMonth()] + " " +
         date.getUTCDate() + ", " +
         date.getUTCFullYear();
}
function renderHeaderDate(date) {
  return months[date.getUTCMonth()] + " " + date.getUTCFullYear();
}

function renderPageNumber(n) {
  return "[Page " + n + "]";
}

var BOILERPLATE_TRUST200902 = [
  [
    "Status of this Memo",
    "",
    "   This Internet-Draft is submitted in full conformance with the",
    "   provisions of BCP 78 and BCP 79.",
  ],
  [
    "   Internet-Drafts are working documents of the Internet Engineering",
    "   Task Force (IETF).  Note that other groups may also distribute",
    "   working documents as Internet-Drafts.  The list of current Internet-",
    "   Drafts is at http://datatracker.ietf.org/drafts/current/.",
  ],
  [
    "   Internet-Drafts are draft documents valid for a maximum of six months",
    "   and may be updated, replaced, or obsoleted by other documents at any",
    "   time.  It is inappropriate to use Internet-Drafts as reference",
    "   material or to cite them other than as \"work in progress.\"",
  ],
  [
    "   This Internet-Draft will expire on March 5, 2015.",
  ],
  [
    "Copyright Notice",
    "",
    "   Copyright (c) 2014 IETF Trust and the persons identified as the",
    "   document authors.  All rights reserved.",
  ],
  [
    "   This document is subject to BCP 78 and the IETF Trust's Legal",
    "   Provisions Relating to IETF Documents",
    "   (http://trustee.ietf.org/license-info) in effect on the date of",
    "   publication of this document.  Please review these documents",
    "   carefully, as they describe your rights and restrictions with respect",
    "   to this document.  Code Components extracted from this document must",
    "   include Simplified BSD License text as described in Section 4.e of",
    "   the Trust Legal Provisions and are provided without warranty as",
    "   described in the Simplified BSD License.",
  ]
];

var TODO_BLOCK = [
  "TODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODOTODO"
];

// Formatting parameters
const RFC_INDENT = 3;
const RFC_COLS = 72;
const RFC_ROWS = 54;
const RFC_TITLE_COLS = 60;

function toTXT(ast) {
  var renderedBlocks = [];

  // TODO Validate that AST has all the expected info
  // TODO Wire references + render references
  // TODO Authors' contact information

  // TODO Render front matter
  // renderedBlocks[0] is the header + title
  var line;
  var expiry = addSixMonths(ast.meta.date);
  var lCol = [
    "Network Working Group",
    "Internet-Draft",
    "Intended status: " + renderStatus(ast.meta.category),
    "Expires: " + renderDate(expiry)
  ];
  var rCol = [];
  for (i in ast.meta.author) {
    i = parseInt(i);
    rCol.push(ast.meta.author[i].ins);
    if ((i >= ast.meta.author.length-1) ||
        (ast.meta.author[i].org != ast.meta.author[i+1].org)) {
      rCol.push(ast.meta.author[i].org);
    }
  }
  rCol.push(renderDate(ast.meta.date));
  var headerLines = ["", "", ""];
  for (var i=0; i<Math.max(lCol.length, rCol.length); ++i) {
    line = blank(RFC_COLS);
    if (i < lCol.length) { line = insertLeftAligned(lCol[i], line); }
    if (i < rCol.length) { line = insertRightAligned(rCol[i], line); }
    headerLines.push(line);
  }
  headerLines.push(""); // Two blank lines before title
  headerLines.push("");
  var wrappedTitle = wrapText(ast.meta.title, 0, RFC_TITLE_COLS);
  for (var i=0; i<wrappedTitle.length; ++i) {
    line = blank(RFC_COLS);
    line = insertCentered(wrappedTitle[i], line);
    headerLines.push(line);
  }
  line = blank(RFC_COLS);
  line = insertCentered(ast.meta.docname, line);
  headerLines.push(line);
  renderedBlocks.push(headerLines);

  // renderedBlocks[1] is the abstract
  var abstractBlock = ["Abstract", ""];
  var abstractLines = wrapText(ast.abstract, RFC_INDENT, RFC_COLS);
  renderedBlocks.push(abstractBlock.concat(abstractLines));

  // renderedBlocks[2] through [7] is the boilerplate
  if (ast.meta.ipr == "trust200902") {
    renderedBlocks = renderedBlocks.concat(BOILERPLATE_TRUST200902);
  } else {
    // assert(false)
  }

  // TODO Compute TOC and insert here
  // renderedBlocks[8] is the TOC
  renderedBlocks.push(TODO_BLOCK);

  // Render each block in the main matter to an array of lines
  var sections = [0,0,0,0,0,0];
  var sectionLocations = [];
  function sectionReset(level) {
    for (var i=level; i<sections.length; ++i) sections[i] = 0;
  }

  function render(block) {
    switch (block.t) {
      case "section":
        sectionReset(block.l);
        sections[block.l - 1] += 1;
        var sectionNumber = sections.slice(0, block.l).join(".") + ". ";
        var wrappedSection = wrapText(block.c, sectionNumber.length, RFC_COLS);
        wrappedSection[0] = sectionNumber + wrappedSection[0].substring(sectionNumber.length);
        return wrappedSection;
      case "text":
        return wrapText(block.c, RFC_INDENT, RFC_COLS);
    }
  }

  for (var i=0; i<ast.blocks.length; ++i) {
    renderedBlocks.push(render(ast.blocks[i]));
  }

  // TODO paginate
  // HDR: Internet-Draft                    ACME                    September 2014
  // FTR: Barnes & Rescorla         Expires March 5, 2015                 [Page 1]
  var pageBreak = "\x0C";
  var header = blank(RFC_COLS);
  header = insertCentered(ast.meta.abbrev, header);
  header = insertLeftAligned("Internet-Draft ", header);
  header = insertRightAligned(renderHeaderDate(ast.meta.date), header);
  var footer = blank(RFC_COLS);
  var authorName;
  if (ast.meta.author.length == 1) {
    authorName = ast.meta.author[0].ins.replace(/^[A-Z.]*\s+/, "");
  } else if (ast.meta.author.length == 2) {
    var lastName1 = ast.meta.author[0].ins.replace(/^[A-Z.]*\s+/, "");
    var lastName2 = ast.meta.author[1].ins.replace(/^[A-Z.]*\s+/, "");
    authorName = lastName1 + " & " + lastName2;
  } else if (ast.meta.author.length > 2) {
    authorName = ast.meta.author[0].ins.replace(/^[A-Z.]*\s+/, "") + ", et al.";
  } else {
    // XXX assert(false)
  }
  footer = insertLeftAligned(authorName, footer);
  footer = insertCentered("Expires " + renderDate(expiry), footer);
  function makeFooter(n) {
    return insertRightAligned(renderPageNumber(n), footer);
  }
  function breakBlock(space, n, lastPage) {
    var spacer = [];
    for (var i=0; i<space; ++i) { spacer.push(""); }

    if (lastPage) {
      return spacer.concat([makeFooter(n), pageBreak]);
    }

    return spacer.concat([makeFooter(n), pageBreak, header]);
  }

  // XXX Very simple pagination algorithm.  Each rendered block is a unit.
  //     No other widow/orphan control or binding.
  //     The "+ 1" are sprinkled about to account for blank lines that
  //     the serializer puts between blocks.
  var currPage = 1;
  var currPageLines = 0;
  var paginatedBlocks = [];
  for (var i=0; i<renderedBlocks.length; ++i) {
    if (currPageLines + renderedBlocks[i].length + 1 <= RFC_ROWS) {
      paginatedBlocks.push(renderedBlocks[i]);
      currPageLines += renderedBlocks[i].length + 1;
      continue;
    }

    // If the next block is too big, insert a spacer
    // block and start a new page
    var spaceNeeded = RFC_ROWS - currPageLines;
    paginatedBlocks.push(breakBlock(spaceNeeded, currPage));
    currPage++;
    currPageLines = renderedBlocks[i].length + 1 + 2; // for the break block
    paginatedBlocks.push(renderedBlocks[i]);
  }
  var spaceNeeded = RFC_ROWS - currPageLines;
  paginatedBlocks.push(breakBlock(spaceNeeded, currPage, true));

  // Serialize
  var rfc = "";
  console.log(renderedBlocks);
  console.log(paginatedBlocks);
  for (i in paginatedBlocks) {
    rfc += paginatedBlocks[i].join("\n");
    rfc += "\n\n"; // Separate blocks by a blank line
  }
  return rfc;
}
