-- =====================================================
-- 种子数据: 宿舍楼 & 房间
-- =====================================================

-- 男生宿舍楼
INSERT INTO dormitory_building (building_name, building_code, gender, floors, status) VALUES
('学生公寓1号楼', 'M1', 1, 6, 1),
('学生公寓2号楼', 'M2', 1, 6, 1);

-- 女生宿舍楼
INSERT INTO dormitory_building (building_name, building_code, gender, floors, status) VALUES
('学生公寓3号楼', 'F1', 0, 6, 1),
('学生公寓4号楼', 'F2', 0, 6, 1);

-- 男生宿舍房间 (1号楼 1-2层, 每层10间, 4人间)
INSERT INTO dormitory_room (building_id, room_number, floor, capacity, occupied, room_type, status) VALUES
(1, '101', 1, 4, 0, 'NORMAL', 0), (1, '102', 1, 4, 0, 'NORMAL', 0),
(1, '103', 1, 4, 0, 'NORMAL', 0), (1, '104', 1, 4, 0, 'NORMAL', 0),
(1, '105', 1, 4, 0, 'NORMAL', 0), (1, '106', 1, 4, 0, 'NORMAL', 0),
(1, '107', 1, 4, 0, 'NORMAL', 0), (1, '108', 1, 4, 0, 'NORMAL', 0),
(1, '109', 1, 4, 0, 'NORMAL', 0), (1, '110', 1, 4, 0, 'NORMAL', 0),
(1, '201', 2, 4, 0, 'NORMAL', 0), (1, '202', 2, 4, 0, 'NORMAL', 0),
(1, '203', 2, 4, 0, 'NORMAL', 0), (1, '204', 2, 4, 0, 'NORMAL', 0),
(1, '205', 2, 4, 0, 'NORMAL', 0), (1, '206', 2, 4, 0, 'NORMAL', 0),
(1, '207', 2, 4, 0, 'NORMAL', 0), (1, '208', 2, 4, 0, 'NORMAL', 0),
(1, '209', 2, 4, 0, 'NORMAL', 0), (1, '210', 2, 4, 0, 'NORMAL', 0);

-- 女生宿舍房间 (3号楼 1-2层, 每层10间, 4人间)
INSERT INTO dormitory_room (building_id, room_number, floor, capacity, occupied, room_type, status) VALUES
(3, '101', 1, 4, 0, 'NORMAL', 0), (3, '102', 1, 4, 0, 'NORMAL', 0),
(3, '103', 1, 4, 0, 'NORMAL', 0), (3, '104', 1, 4, 0, 'NORMAL', 0),
(3, '105', 1, 4, 0, 'NORMAL', 0), (3, '106', 1, 4, 0, 'NORMAL', 0),
(3, '107', 1, 4, 0, 'NORMAL', 0), (3, '108', 1, 4, 0, 'NORMAL', 0),
(3, '109', 1, 4, 0, 'NORMAL', 0), (3, '110', 1, 4, 0, 'NORMAL', 0),
(3, '201', 2, 4, 0, 'NORMAL', 0), (3, '202', 2, 4, 0, 'NORMAL', 0),
(3, '203', 2, 4, 0, 'NORMAL', 0), (3, '204', 2, 4, 0, 'NORMAL', 0),
(3, '205', 2, 4, 0, 'NORMAL', 0), (3, '206', 2, 4, 0, 'NORMAL', 0),
(3, '207', 2, 4, 0, 'NORMAL', 0), (3, '208', 2, 4, 0, 'NORMAL', 0),
(3, '209', 2, 4, 0, 'NORMAL', 0), (3, '210', 2, 4, 0, 'NORMAL', 0);

-- 无障碍宿舍 (1层方便进出)
INSERT INTO dormitory_room (building_id, room_number, floor, capacity, occupied, room_type, status) VALUES
(1, '100', 1, 2, 0, 'ACCESSIBLE', 0),
(3, '100', 1, 2, 0, 'ACCESSIBLE', 0);
