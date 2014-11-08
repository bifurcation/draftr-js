# Architecture for draftr.js

In this document, we describe the structure of the JS object that represents a document, which defines what parsers and renderers have to do.

## Starting point: xml2rfc

The following is a summary of the xml2rfc v2 schema for documents, as defined in draft-reschke-xml2rfc-latest:

* Front: title, author+, date, area*, workgroup*, keyword*, abstract?, note*
* Middle: section+
* Section: \[anchor,title,toc\] (t | figure | texttable | iref)* section*
* Text: \[anchor,hangText\] (text | \list | figure | xref | eref | iref | cref | spanx | vspace)*
* List: \[style, hangIndent, counter\] t+
* Text table: \[anchor, title, suppress-title, align, style\] preamble?, ttcol+, c*, postamble?
* Figure: \[anchor, title, suppress-title, src, align, alt, width, height\] iref*, preamble?, artwork, postamble?

We will follow the logical model of xml2rfc, with the following differences to simplify support for other source languages (e.g., Markdown):

* The following elements / attributes are not supported:
  * iref (indexing is not supported)
  * cref (comments are not supported)
  * preamble (just use t)
  * postamble (just use t)
  * section.toc
  * t.anchor, t.hangText
  * list.counter, list.hangIndent
  * xref.pageno
  * texttable.suppress-title, texttable.align, texttable.style
  * figure.suppress-title, figure.align, figure.style, figure.src, figure.align figure.width, figure.height
* xref and eref are treated in the same way (xref starts with "#")
* figure within t is not supported
* Multiple area or workgroup elements are not supported

We thus follow roughly the following simplified schema:

* Front: title, author+, date, area*, workgroup*, keyword*, abstract?, note*
* Middle: section+
* Section: \[anchor,title,toc\] (t | figure | texttable | iref)* section*
* Text: \[anchor,hangText\] (text | \list | figure | xref | eref | iref | cref | spanx | vspace)*
* List: \[style, hangIndent, counter\] t+
* Text table: \[anchor, title, suppress-title, align, style\] preamble?, ttcol+, c*, postamble?
* Figure: \[anchor, title, suppress-title, src, align, alt, width, height\] iref*, preamble?, artwork, postamble?


## Supported formats

| Format      | Parse        | Render      | Notes               |
|:============|:============:|:===========:|:====================|
| Markdown    | In progress  | TODO        | With YAML header    |
| XML         | TODO         | TODO        | In xml2rfc format   |
| Text        | TODO         | In progress | In RFC / I-D format |
| PDF         | No           | TODO?       | See: pdfkit         |
| HTML        | No           | TODO?       |                     |
| ePub        | No           | TODO?       |                     |
| LaTeX       | TODO?        | TODO?       | Would need metadata |

