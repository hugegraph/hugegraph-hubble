# language: en
Feature: select hugeGraph's filter_vertices_query

  @lxb
  Scenario Outline: filter_vertices_query -- <scene>
    When filter_vertices_query -- 127.0.0.1:8088
    Given filter_vertices_query -- <scene>  -- <param>
    Then filter_vertices_query -- <ass>
    Examples:
      | scene | param | ass |
      | 正例 | {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko", "direction": "OUT", "edge_label": "knows", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]}  | {"status":200, "message":"None"} |
      | connection_id字段不存在 | {"vertex_label":"person",  "vertex_id":"1:marko", "direction": "OUT", "edge_label": "knows", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]} | {"status":400, "message":"None"} |
      | connection_id字段错误 | {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko", "direction": "OUT", "edge_label": "knows", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]}  | { "status":400, "message":"查找 id 为 0 的图连接失败" } |
      | vertex_id字段错误 | {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko_error", "direction": "OUT", "edge_label": "knows", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]}  | {"status":200, "message":"None"} |
      | vertex_id字段不存在 | {"vertex_label":"person", "connection_id":0, "direction": "OUT", "edge_label": "knows", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]}  | {"status":400, "message":"参数 vertex_id 不能为 null"} |
      | direction字段不存在 | {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko", "edge_label": "knows", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]}  | {"status":200, "message":"None"} |
      | direction为BOTH |  {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko", "direction": "BOTH", "edge_label": "knows", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]} | {"status":200, "message":"None"} |
      | direction为OUT |  {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko", "direction": "OUT", "edge_label": "knows", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]} | {"status":200, "message":"None"} |
      | direction为IN|  {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko", "direction": "IN", "edge_label": "knows", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]} | {"status":200, "message":"None"} |
      | conditions字段不存在 | {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko", "direction": "OUT", "edge_label": "knows"}  | {"status":200, "message":"None"} |
      | conditions字段为空 | {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko", "direction": "OUT", "edge_label": "knows", "conditions": []} | {"status":200, "message":"None"} |
      | edge_label字段为空 | {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko", "direction": "OUT", "edge_label": "", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]}  | {"status":400, "message":"Gremlin 执行失败，详细信息: Edge label name can't be empty"} |
      | edge_label字段不存在 | {"vertex_label":"person", "connection_id":0, "vertex_id":"1:marko", "direction": "OUT", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]}  | {"status":200, "message":"None"} |
      | vertex_label字段为空 | {"vertex_label":"", "connection_id":0, "vertex_id":"1:marko", "direction": "OUT", "edge_label": "knows", "conditions": [{"key": "name", "operator": "gt", "value": 0.1}]}  | {"status":400, "message":"None"} |
      | vertex_label字段不存在 | {"connection_id":25, "vertex_id":5, "direction": "IN",  "conditions": [{"key": "weight", "operator": "gt", "value": 0.1}]}  | {"status":400, "message":"参数 vertex_label 不能为 null"} |
