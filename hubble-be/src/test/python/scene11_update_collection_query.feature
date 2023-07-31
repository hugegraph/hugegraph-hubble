# language: en
Feature: update hugeGraph's gremlin-collections

  @lxb
  Scenario Outline: update query_collections -- <scene>
    When update query_collections -- 127.0.0.1:8088
    Given update query_collections -- <action>
    Then update query_collections -- <ass>
    Examples:
      | scene | action |ass |
      | 更新收藏name改变 |  update_name |{"status":200, "message":"None"} |
      | 更新收藏content改变 | update_content |{"status":200, "message":"None"} |
