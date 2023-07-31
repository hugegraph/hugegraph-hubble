# language: en
Feature: select_by_id hugeGraph's gremlin-collections

  @lxb
  Scenario Outline: select_by_id query_collections -- <scene>
    When select_by_id query_collections -- 127.0.0.1:8088
    Given select_by_id query_collections
    Then select_by_id query_collections -- <ass>
    Examples:
      | scene | ass |
      | 查询单条语句 | {"status":200,"message":"None} |

