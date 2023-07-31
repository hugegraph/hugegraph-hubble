# language: en
Feature: delete hugeGraph's execute_records

  @lxb
  Scenario Outline: delete execute_records -- <scene>
    When delete execute_records -- 127.0.0.1:8088 -- <select_param>
    Given delete execute_records
    Then delete execute_records -- <ass>
    Examples:
      | scene | select_param | ass |
      | 正例(删除) | page_size=100&page_no=1 | {"status":200,"data_status":"SUCCESS"} |

