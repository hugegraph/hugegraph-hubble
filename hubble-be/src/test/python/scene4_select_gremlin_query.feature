# language: en
Feature: select hugeGraph's query

  @lxb
  Scenario Outline: select gremlin_query -- <scene>
    When select gremlin_query -- 127.0.0.1:8088
    Given select gremlin_query -- <scene> -- <param>
    Then select gremlin_query -- <ass>
    Examples:
      | scene | param | ass |
      | 创建property_key | {"connection_id":0, "content": "graph.schema().propertyKey('name').asText().ifNotExist().create()\n graph.schema().propertyKey('age').asInt().ifNotExist().create() \n graph.schema().propertyKey('city').asText().ifNotExist().create() \n graph.schema().propertyKey('lang').asText().ifNotExist().create() \n graph.schema().propertyKey('date').asText().ifNotExist().create() \n graph.schema().propertyKey('price').asInt().ifNotExist().create()"}  | {"status":200,"message":"None"} |
      | 创建vertex_label | {"connection_id":0, "content": "person = graph.schema().vertexLabel('person').properties('name', 'age', 'city').primaryKeys('name').ifNotExist().create() \n software = graph.schema().vertexLabel('software').properties('name', 'lang', 'price').primaryKeys('name').ifNotExist().create()"}  | {"status":200,"message":"None"} |
      | 创建edge_label | {"connection_id":0, "content": "knows = graph.schema().edgeLabel('knows').sourceLabel('person').targetLabel('person').properties('date').ifNotExist().create() \n created = graph.schema().edgeLabel('created').sourceLabel('person').targetLabel('software').properties('date', 'city').ifNotExist().create()"} | {"status":200,"message":"None"} |
      | 创建vertex & edge | {"connection_id":0, "content": "marko = graph.addVertex(T.label, 'person', 'name', 'marko', 'age', 29, 'city', 'Beijing') \n vadas = graph.addVertex(T.label, 'person', 'name', 'vadas', 'age', 27, 'city', 'Hongkong') \n lop = graph.addVertex(T.label, 'software', 'name', 'lop', 'lang', 'java', 'price', 328) \n josh = graph.addVertex(T.label, 'person', 'name', 'josh', 'age', 32, 'city', 'Beijing') \n ripple = graph.addVertex(T.label, 'software', 'name', 'ripple', 'lang', 'java', 'price', 199) \n peter = graph.addVertex(T.label, 'person','name', 'peter', 'age', 29, 'city', 'Shanghai') \n marko.addEdge('knows', vadas, 'date', '20160110') \n marko.addEdge('knows', josh, 'date', '20130220') \n marko.addEdge('created', lop, 'date', '20171210', 'city', 'Shanghai') \n josh.addEdge('created', ripple, 'date', '20151010', 'city', 'Beijing') \n josh.addEdge('created', lop, 'date', '20171210', 'city', 'Beijing') \n peter.addEdge('created', lop, 'date', '20171210', 'city', 'Beijing')"}  | {"status":200,"message":"None"} |
      | 正例查询 | {"connection_id":0, "content":"g.V().limit(20)"}  | {"status":200,"message":"None"} |

      | connection_id字段不存在 | { "content":"g.V().limit(10)"} | {"status":400, "message":"None"} |
      | connection_id字段错误 | {"connection_id":0, "content":"g.V().limit(10)"}  | { "status":400, "message":"查找 id 为 0 的图连接失败" } |
      | content字段为空 | {"connection_id":0, "content":""}  | {"status":400, "message":"参数 gremlin-query.content 不能为 null 或空"} |
      | content字段不存在 | {"connection_id":0}  | {"status":400, "message":"参数 gremlin-query.content 不能为 null 或空"} |


