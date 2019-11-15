# language: en
Feature: select hugegraph's connections

  @lxb
  Scenario Outline: hugegraph-hubble v1.1-select hugegraph's connections
    When  测试场景为:<scene>  请求路径:<url>
    Given 查询图链接的参数为<param>
    Then  请求值和断言为<ass>比较输出case的测试结果
    Examples:
      | scene | url | param | ass |
      ### graphOrder默认为时间排序 pageSize默认值为10 pageNo默认为1
      | 所有字段不存时 | localhost:8088 | null | {"status":200} |
#      | cotent字段搜索(图ID) | localhost:8088 | cotent=2 | {"status":"200","message":"None"} |
#      | cotent字段搜索(图名) | localhost:8088 | { "name": "test3","graph" : "testGraphV3","host" : "localhost","port" : 8086,"username":"","password":""}  | {"status":"400"} |
#      ### graphOrder存在时按graph排序
#      | graphOrder字段为desc | localhost:8088 | { "name": "test1","graph" : "testGraphV1","host" : "localhost","port" : 8087,"username":"","password":"9fd95c9c-711b-415b-b85f-d4df46ba5c31"}  | {"status":"400","message": "用户名和密码要么都设置，要么都不设置"} |
#      | graphOrder字段为asc | localhost:8088 | { "name": "test1","graph" : "testGraphV1","host" : "localhost","port" : 8085,"username":"testGraphV1"}  | {"status":"500","message": "graph-connection.username-and-password.invalid"} |
#      | pageSize大于等于图链接数，查看首页 | localhost:8088 | { "graph" : "testGraphV1","host" : "localhost","port" : 8087,"username":"testGraphV1","password":"9fd95c9c-711b-415b-b85f-d4df46ba5c31"}  | {"status":"400","message": "参数 name 不能为 null 或空"} |
#      | pageSize小于图链接数，查看首页 | localhost:8088 | { "name": "","graph" : "testGraphV1","host" : "localhost","port" : 8087,"username":"testGraphV1","password":"9fd95c9c-711b-415b-b85f-d4df46ba5c31"}  | {"status":"400","message": "参数 name 不能为 null 或空"} |
#      | pageSize小于图链接数，查看尾页  | localhost:8088 | { "name": "test1","host" : "localhost","port" : 8087,"username":"testGraphV1","password":"9fd95c9c-711b-415b-b85f-d4df46ba5c31"}  | {"status":"400","message": "参数 graph 不能为 null 或空"} |
#      | pageNo为0页 | localhost:8088 | { "name": "test1","graph" : "testGraphV1","port" : 8087,"username":"testGraphV1","password":"9fd95c9c-711b-415b-b85f-d4df46ba5c31"}  | {"status":"400","message": "参数 host 不能为 null 或空"} |
#      | pageSize为0时 | localhost:8088 | { "name": "test1","graph" : "testGraphV1","host" : "","port" : 8087,"username":"testGraphV1","password":"9fd95c9c-711b-415b-b85f-d4df46ba5c31"}  | {"status":"400","message": "参数 host 不能为 null 或空"} |
#      | 所有字段都存在时 | localhost:8088 |  | {"status":"200","message": "None"} |
