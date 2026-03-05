import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'sync_service.dart';

class ConnectivityWatcher {
  final SyncService _syncService;
  final String Function() _getUserId;
  StreamSubscription<List<ConnectivityResult>>? _subscription;

  ConnectivityWatcher(this._syncService, this._getUserId);

  void start() {
    _subscription = Connectivity().onConnectivityChanged.listen((results) {
      if (results.any((r) => r != ConnectivityResult.none)) {
        final userId = _getUserId();
        if (userId.isNotEmpty) {
          _syncService
              .syncPending(userId)
              .then((_) => _syncService.fetchAndMerge(userId));
        }
      }
    });
  }

  void stop() {
    _subscription?.cancel();
    _subscription = null;
  }
}
