# language: en
Feature: select hugeGraph's filter_vertices

  @lxb
  Scenario Outline: neighbor_vertices -- <scene>
    When neighbor_vertices -- 127.0.0.1:8088
    Given neighbor_vertices -- <scene> -- <param>
    Then neighbor_vertices -- <ass>
    Examples:
      | scene | param | ass |
      | 正例 | {"connection_id":0, "vertex_id":"1:josh", "vertex_label": "person"}  | {"status":200, "message":"None"} |
      | connection_id字段不存在 | {"vertex_id":"1:josh","vertex_label": "person"} | {"status":400, "message":"None"} |
      | connection_id字段错误 | {"connection_id":0, "vertex_id":"1:josh","vertex_label": "person"}  | { "status":400, "message":"查找 id 为 0 的图连接失败" } |
      | content字段为空 | {"connection_id":0, "vertex_id":"","vertex_label": "person"}  | {"status":200,"message":"None"} |
      | content字段不存在 | {"connection_id":0,"vertex_label": "person"}  | {"status":400, "message":"参数 vertex_id 不能为 null"} |
      | vertex_label字段为空 | {"connection_id":0, "vertex_id":"1:josh", "vertex_label": ""}  | {"status":400, "message":"None"} |
      | vertex_label字段不存在 | {"connection_id":0, "vertex_id":"1:josh"}  | {"status":400, "message":"None"} |

