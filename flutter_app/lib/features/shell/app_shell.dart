import 'dart:async';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../../models/poi.dart';
import '../../core/database/poi_dao.dart';
import '../../core/sync/sync_service.dart';
import '../../core/sync/connectivity_watcher.dart';
import '../../services/gps_service.dart';
import '../map/map_screen.dart';
import '../places/places_screen.dart';

class AppShell extends StatefulWidget {
  final String userId;

  const AppShell({super.key, required this.userId});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  final _dao = PoiDao();
  late final SyncService _syncService;
  late final ConnectivityWatcher _connectivityWatcher;
  final _gps = GpsService();
  final _uuid = const Uuid();

  int _tab = 0;
  List<Poi> _pois = [];
  bool _saving = false;
  String? _toastMessage;
  Timer? _toastTimer;
  ({double lat, double lng})? _flyTarget;

  @override
  void initState() {
    super.initState();
    _syncService = SyncService(_dao);
    _connectivityWatcher = ConnectivityWatcher(_syncService, () => widget.userId);
    _connectivityWatcher.start();
    _init();
  }

  Future<void> _init() async {
    final pois = await _dao.getAllPois();
    if (mounted) setState(() => _pois = pois);
    await _syncService.syncPending(widget.userId);
    await _syncService.fetchAndMerge(widget.userId);
    final updated = await _dao.getAllPois();
    if (mounted) setState(() => _pois = updated);
  }

  @override
  void dispose() {
    _connectivityWatcher.stop();
    _toastTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (_saving) return;
    setState(() => _saving = true);
    try {
      final position = await _gps.getCurrentPosition();
      final poi = Poi(
        localId: _uuid.v4(),
        lat: position.latitude,
        lng: position.longitude,
        title: '',
        createdAt: DateTime.now(),
        syncStatus: SyncStatus.pending,
      );
      await _dao.insertPoi(poi);
      setState(() => _pois = [poi, ..._pois]);
      _showToast('Plats sparad!');
      unawaited(_syncService.syncSinglePoi(poi, widget.userId).then((_) async {
        final updated = await _dao.getAllPois();
        if (mounted) setState(() => _pois = updated);
      }));
    } catch (e) {
      _showToast('Kunde inte hämta position.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _showToast(String message) {
    _toastTimer?.cancel();
    setState(() => _toastMessage = message);
    _toastTimer = Timer(const Duration(milliseconds: 2500), () {
      if (mounted) setState(() => _toastMessage = null);
    });
  }

  void _handlePoiUpdated(Poi updated) {
    setState(() {
      _pois = _pois.map((p) => p.localId == updated.localId ? updated : p).toList();
    });
  }

  void _handleShowOnMap(double lat, double lng) {
    setState(() {
      _flyTarget = (lat: lat, lng: lng);
      _tab = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          IndexedStack(
            index: _tab,
            children: [
              MapScreen(
                pois: _pois,
                flyTarget: _flyTarget,
                onFlyComplete: () => setState(() => _flyTarget = null),
              ),
              PlacesScreen(
                pois: _pois,
                userId: widget.userId,
                onPoiUpdated: _handlePoiUpdated,
                onShowOnMap: _handleShowOnMap,
              ),
            ],
          ),
          if (_toastMessage != null)
            Positioned(
              bottom: 100,
              left: 24,
              right: 24,
              child: IgnorePointer(
                child: Material(
                  borderRadius: BorderRadius.circular(8),
                  color: Colors.black87,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: Text(
                      _toastMessage!,
                      style: const TextStyle(color: Colors.white),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ),
            ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _BottomNav(
              currentIndex: _tab,
              saving: _saving,
              onTap: (i) => setState(() => _tab = i),
              onSave: _handleSave,
            ),
          ),
        ],
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final int currentIndex;
  final bool saving;
  final ValueChanged<int> onTap;
  final VoidCallback onSave;

  const _BottomNav({
    required this.currentIndex,
    required this.saving,
    required this.onTap,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
      ),
      child: SafeArea(
        child: SizedBox(
          height: 56,
          child: Row(
            children: [
              Expanded(
                child: _NavItem(
                  icon: Icons.map_outlined,
                  label: 'Karta',
                  selected: currentIndex == 0,
                  onTap: () => onTap(0),
                ),
              ),
              SizedBox(
                width: 72,
                child: Center(
                  child: GestureDetector(
                    onTap: saving ? null : onSave,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: saving ? Colors.grey : Colors.black,
                        shape: BoxShape.circle,
                      ),
                      child: saving
                          ? const Padding(
                              padding: EdgeInsets.all(14),
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.add, color: Colors.white, size: 28),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: _NavItem(
                  icon: Icons.place_outlined,
                  label: 'Mina platser',
                  selected: currentIndex == 1,
                  onTap: () => onTap(1),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: selected ? Colors.black : Colors.grey),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(fontSize: 10, color: selected ? Colors.black : Colors.grey),
          ),
        ],
      ),
    );
  }
}
