SELECT 1;
-- INSERT INTO `graph_connection`(name, graph, host, port, timeout, create_time) VALUES ('s', 'hugegraph', 'localhost', 8080, 60, sysdate);

-- INSERT INTO `gremlin_collection`(name, content, create_time) VALUES ('first_gremlin', 'g.V().limit(10)', sysdate);

-- INSERT INTO `execute_history`(execute_type, content, execute_status, duration, create_time) VALUES (0, 'g.V().limit(100)', 0, 20, sysdate);

DELETE FROM `resources`;
DELETE FROM `resources_role_rel`;

INSERT INTO `resources` (`id`, `path`, `type`) VALUES (1, '/test', 1);

INSERT INTO `resources_role_rel` (`resources_id`, `role_type`) VALUES (1, 1);