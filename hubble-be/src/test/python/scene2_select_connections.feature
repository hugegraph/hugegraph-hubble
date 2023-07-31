# language: en
Feature: select hugeGraph's connections

  @lxb
  Scenario Outline: select connections -- <scene>
    When select connections -- request_host: 127.0.0.1:8088
    Given select connections -- param: <param>
    Then select connections -- compare_assert: <ass>
    Examples:
      | scene                 | param                                                     | ass                                                 |
      | cotent字段搜索(图ID)       | content=20                                                | {"status":200,"content":"id","id":1000}             |
      | cotent字段搜索(图名)        | page_no=1&page_size=10&content=hugegraph1                 | {"status":200,"content":"name","name":"hugegraph1"} |
      | graph_order字段为desc     | page_no=1&page_size=10&graph_order=desc                   | {"status":200,"graph_order":"desc"}                    |
      | graph_order字段为asc      | page_no=1&page_size=10&graph_order=asc                    | {"status":200,"graph_order":"asc"}                     |
      | 默认排序                  | page_no=1&page_size=10                                    | {"status":"200","graph_order":"default"}               |
      | 所有字段不存时               | null                                                      | {"status":200,"default":"all"}                      |
      | page_size大于等于图链接数，查看首页 | page_no=1&page_size=10                                    | {"status":200, "page_no":1, "page_size":10}     |
      | page_size小于图链接数，查看首页   | page_no=1&page_size=3&content=hugegraph1                  | {"status":200, "page_no":1, "page_size":3}        |
      | page_size小于图链接数，查看尾页   | page_no=2&page_size=3&content=hugegraph1                  | {"status":200, "page_no":2, "page_size":3}       |
      | 所有字段都存在时              | page_no=1&page_size=10&content=hugegraph1&graph_order=asc | {"status":200}                                      |


