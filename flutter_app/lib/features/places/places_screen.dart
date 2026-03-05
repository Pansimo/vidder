import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../models/poi.dart';
import 'place_detail_screen.dart';

class PlacesScreen extends StatefulWidget {
  final List<Poi> pois;
  final String userId;
  final ValueChanged<Poi> onPoiUpdated;
  final void Function(double lat, double lng) onShowOnMap;

  const PlacesScreen({
    super.key,
    required this.pois,
    required this.userId,
    required this.onPoiUpdated,
    required this.onShowOnMap,
  });

  @override
  State<PlacesScreen> createState() => _PlacesScreenState();
}

class _PlacesScreenState extends State<PlacesScreen> {
  String _search = '';

  List<Poi> get _filtered => widget.pois
      .where((p) => p.title.toLowerCase().contains(_search.toLowerCase()))
      .toList();

  String _formatDate(DateTime dt) {
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }

  Color _syncColor(SyncStatus s) {
    switch (s) {
      case SyncStatus.synced:
        return Colors.green;
      case SyncStatus.pending:
        return Colors.amber;
      case SyncStatus.failed:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mina platser'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Sök platser...',
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.grey[100],
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                contentPadding: EdgeInsets.zero,
              ),
              onChanged: (v) => setState(() => _search = v),
            ),
          ),
        ),
      ),
      body: _filtered.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.place_outlined, size: 48, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    _search.isEmpty
                        ? 'Inga platser sparade ännu.'
                        : 'Inga platser matchar sökningen.',
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            )
          : ListView.builder(
              itemCount: _filtered.length,
              itemBuilder: (context, i) {
                final poi = _filtered[i];
                return ListTile(
                  leading: CircleAvatar(
                    radius: 6,
                    backgroundColor: _syncColor(poi.syncStatus),
                  ),
                  title: Text(poi.title.isEmpty ? 'Namnlös plats' : poi.title),
                  subtitle: Text(_formatDate(poi.createdAt)),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () async {
                    final updated = await Navigator.push<Poi>(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PlaceDetailScreen(
                          poi: poi,
                          userId: widget.userId,
                          onShowOnMap: widget.onShowOnMap,
                        ),
                      ),
                    );
                    if (updated != null) widget.onPoiUpdated(updated);
                  },
                );
              },
            ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: TextButton(
            onPressed: () => Supabase.instance.client.auth.signOut(),
            child: const Text('Logga ut', style: TextStyle(color: Colors.grey)),
          ),
        ),
      ),
    );
  }
}
