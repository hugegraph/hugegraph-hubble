# language: en
Feature: select hugeGraph's query_collections

  @lxb
  Scenario Outline: select query_collections（datesets:12）-- <scene>
    When select query_collections -- 127.0.0.1:8088
    Given select query_collections -- <param>
    Then select query_collections -- <ass>
    Examples:
      | scene |param | ass |
      | 正例(参数默认) | null  | {"status":200,  "page_size":10, "page_no":1} |
      | content搜索语句名 | page_no=2  | {"status":200, "page_size":10, "page_no":2} |
      | content搜索内容 | null  | {"status":200, "page_size":10, "page_no":1} |
      | name_order排序asc | page_size=16&page_no=1  | {"status":200, "page_size":16, "page_no":1} |
      | name_order排序desc | page_size=8&page_no=1  | {"status":200, "page_size":8, "page_no":1} |
      | page_no=1|  page_size=8&page_no=2 | {"status":200, "page_size":8, "page_no":2} |
      | page_no=2 |  page_size=8&page_no=2 | {"status":200, "page_size":8, "page_no":2} |
      | page_size=8|  page_size=8&page_no=2 | {"status":200, "page_size":8, "page_no":2} |
      | page_size=15 |  page_size=8&page_no=2 | {"status":200, "page_size":8, "page_no":2} |
      | page_size=15 & page_no=1|  page_size=8&page_no=2 | {"status":200, "page_size":8, "page_no":2} |
      | page_size=8 & page_no=2 |  page_size=8&page_no=2 | {"status":200, "page_size":8, "page_no":2} |

