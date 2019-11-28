# language: en
Feature: select hugeGraph's execute_records

  @lxb
  Scenario Outline: select execute_records -- <scene>
    When select execute_records -- 127.0.0.1:8088
    Given select execute_records -- <param>
    Then select execute_records -- <ass>
    Examples:
      | scene | param | ass |
      | page_size默认首页 | page_no=1  | {"status":200,  "page_size":10, "page_no":1} |
      | page_size默认尾页 | page_no=2  | {"status":200, "page_size":10, "page_no":2} |
      | page_size && page_no默认 | null  | {"status":200, "page_size":10, "page_no":1} |
      | page_size>条数首页 | page_size=16&page_no=1  | {"status":200, "page_size":16, "page_no":1} |
      | page_size<=条数首页 | page_size=3&page_no=1  | {"status":200, "page_size":3, "page_no":1} |
      | page_size<条数尾页 |  page_size=3&page_no=2 | {"status":200, "page_size":3, "page_no":2} |


