# language: en
Feature: delete hugeGraph's query_collections

  @lxb
  Scenario Outline: delete query_connections -- <scene>
    When delete query_connections -- 127.0.0.1:8088 -- <param>
    Given delete query_connections
    Then delete query_connections -- <ass>
    Examples:
      | scene | param | ass |
      | 删除收藏语句 | page_no=1&page_size=50  | {"status":200,"message":"None"} |






