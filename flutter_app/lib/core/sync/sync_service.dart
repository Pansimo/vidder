import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/poi.dart';
import '../database/poi_dao.dart';

class SyncService {
  final PoiDao _dao;
  final SupabaseClient _supabase;

  SyncService(this._dao) : _supabase = Supabase.instance.client;

  Future<void> syncSinglePoi(Poi poi, String userId) async {
    try {
      final data = {
        'user_id': userId,
        'title': poi.title,
        'note': poi.note,
        'lat': poi.lat,
        'lng': poi.lng,
        'visibility': 'private',
        'visited_at': poi.createdAt.toIso8601String(),
      };
      final result = await _supabase.from('pois').insert(data).select('id').single();
      final serverId = result['id'] as String;
      await _dao.updateSyncStatus(poi.localId, SyncStatus.synced, serverId: serverId);
    } catch (_) {
      await _dao.updateSyncStatus(poi.localId, SyncStatus.failed);
    }
  }

  Future<void> syncPending(String userId) async {
    final pending = await _dao.getPendingPois();
    for (final poi in pending) {
      await syncSinglePoi(poi, userId);
    }
  }

  Future<void> fetchAndMerge(String userId) async {
    try {
      final rows = await _supabase
          .from('pois')
          .select('id, title, note, lat, lng, visited_at')
          .eq('user_id', userId);
      final localPois = await _dao.getAllPois();
      final serverIds = localPois.map((p) => p.serverId).whereType<String>().toSet();
      for (final row in rows) {
        final serverId = row['id'] as String;
        if (!serverIds.contains(serverId)) {
          final poi = Poi(
            localId: serverId,
            serverId: serverId,
            lat: (row['lat'] as num).toDouble(),
            lng: (row['lng'] as num).toDouble(),
            title: row['title'] as String? ?? '',
            note: row['note'] as String?,
            createdAt: DateTime.parse(row['visited_at'] as String),
            syncStatus: SyncStatus.synced,
          );
          await _dao.insertPoi(poi);
        }
      }
    } catch (_) {
      // silently fail — offline
    }
  }

  Future<void> updateServerPoi(String serverId, {String? title, String? note}) async {
    try {
      final data = <String, dynamic>{};
      if (title != null) data['title'] = title;
      if (note != null) data['note'] = note;
      if (data.isEmpty) return;
      await _supabase.from('pois').update(data).eq('id', serverId);
    } catch (_) {
      // silently fail
    }
  }
}
