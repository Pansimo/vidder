enum SyncStatus { pending, synced, failed }

class Poi {
  final String localId;
  final String? serverId;
  final double lat;
  final double lng;
  final String title;
  final String? note;
  final DateTime createdAt;
  final SyncStatus syncStatus;

  const Poi({
    required this.localId,
    this.serverId,
    required this.lat,
    required this.lng,
    this.title = '',
    this.note,
    required this.createdAt,
    this.syncStatus = SyncStatus.pending,
  });

  Poi copyWith({
    String? localId,
    String? serverId,
    double? lat,
    double? lng,
    String? title,
    String? note,
    DateTime? createdAt,
    SyncStatus? syncStatus,
  }) {
    return Poi(
      localId: localId ?? this.localId,
      serverId: serverId ?? this.serverId,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      title: title ?? this.title,
      note: note ?? this.note,
      createdAt: createdAt ?? this.createdAt,
      syncStatus: syncStatus ?? this.syncStatus,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'local_id': localId,
      'server_id': serverId,
      'lat': lat,
      'lng': lng,
      'title': title,
      'note': note,
      'created_at': createdAt.toIso8601String(),
      'sync_status': syncStatus.name,
    };
  }

  factory Poi.fromMap(Map<String, dynamic> map) {
    return Poi(
      localId: map['local_id'] as String,
      serverId: map['server_id'] as String?,
      lat: map['lat'] as double,
      lng: map['lng'] as double,
      title: map['title'] as String? ?? '',
      note: map['note'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
      syncStatus: SyncStatus.values.firstWhere(
        (s) => s.name == map['sync_status'],
        orElse: () => SyncStatus.pending,
      ),
    );
  }
}
