import 'package:sqflite/sqflite.dart';
import '../../models/poi.dart';
import 'local_database.dart';

class PoiDao {
  Future<Database> get _db => LocalDatabase.database;

  Future<List<Poi>> getAllPois() async {
    final db = await _db;
    final maps = await db.query('pois', orderBy: 'created_at DESC');
    return maps.map(Poi.fromMap).toList();
  }

  Future<void> insertPoi(Poi poi) async {
    final db = await _db;
    await db.insert('pois', poi.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<void> updatePoi(Poi poi) async {
    final db = await _db;
    await db.update('pois', poi.toMap(), where: 'local_id = ?', whereArgs: [poi.localId]);
  }

  Future<List<Poi>> getPendingPois() async {
    final db = await _db;
    final maps = await db.query('pois', where: "sync_status = 'pending'");
    return maps.map(Poi.fromMap).toList();
  }

  Future<void> updateSyncStatus(
    String localId,
    SyncStatus status, {
    String? serverId,
  }) async {
    final db = await _db;
    final data = <String, dynamic>{'sync_status': status.name};
    if (serverId != null) data['server_id'] = serverId;
    await db.update('pois', data, where: 'local_id = ?', whereArgs: [localId]);
  }

  Future<void> updatePoiFields(String localId, {String? title, String? note}) async {
    final db = await _db;
    final data = <String, dynamic>{};
    if (title != null) data['title'] = title;
    if (note != null) data['note'] = note;
    if (data.isEmpty) return;
    await db.update('pois', data, where: 'local_id = ?', whereArgs: [localId]);
  }

  Future<String?> getSetting(String key) async {
    final db = await _db;
    final result = await db.query('settings', where: 'key = ?', whereArgs: [key]);
    if (result.isEmpty) return null;
    return result.first['value'] as String;
  }

  Future<void> setSetting(String key, String value) async {
    final db = await _db;
    await db.insert(
      'settings',
      {'key': key, 'value': value},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }
}
