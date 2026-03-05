import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import '../../models/poi.dart';
import '../../core/database/poi_dao.dart';

class MapScreen extends StatefulWidget {
  final List<Poi> pois;
  final ({double lat, double lng})? flyTarget;
  final VoidCallback? onFlyComplete;

  const MapScreen({
    super.key,
    required this.pois,
    this.flyTarget,
    this.onFlyComplete,
  });

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  MapboxMap? _mapboxMap;
  PointAnnotationManager? _annotationManager;
  final _dao = PoiDao();
  final Map<String, PointAnnotation> _annotations = {};

  static const _defaultLat = 59.3293;
  static const _defaultLng = 18.0686;
  static const _defaultZoom = 12.0;

  @override
  void didUpdateWidget(MapScreen old) {
    super.didUpdateWidget(old);
    _syncMarkers();
    if (widget.flyTarget != null && widget.flyTarget != old.flyTarget) {
      _flyTo(widget.flyTarget!.lat, widget.flyTarget!.lng);
      widget.onFlyComplete?.call();
    }
  }

  Future<void> _onMapCreated(MapboxMap map) async {
    _mapboxMap = map;
    _annotationManager = await map.annotations.createPointAnnotationManager();
    await _restoreCameraPosition(map);
    _syncMarkers();
  }

  Future<void> _restoreCameraPosition(MapboxMap map) async {
    final saved = await _dao.getSetting('map_position');
    if (saved != null) {
      try {
        final data = jsonDecode(saved) as Map<String, dynamic>;
        await map.setCamera(CameraOptions(
          center: Point(
            coordinates: Position(
              data['lng'] as double,
              data['lat'] as double,
            ),
          ),
          zoom: data['zoom'] as double,
        ));
        return;
      } catch (_) {}
    }
    await map.setCamera(CameraOptions(
      center: Point(coordinates: Position(_defaultLng, _defaultLat)),
      zoom: _defaultZoom,
    ));
  }

  Future<void> _saveMapPosition() async {
    final map = _mapboxMap;
    if (map == null) return;
    try {
      final state = await map.getCameraState();
      await _dao.setSetting(
        'map_position',
        jsonEncode({
          'lat': state.center.coordinates.lat,
          'lng': state.center.coordinates.lng,
          'zoom': state.zoom,
        }),
      );
    } catch (_) {}
  }

  Future<void> _syncMarkers() async {
    final manager = _annotationManager;
    if (manager == null) return;

    final currentIds = widget.pois.map((p) => p.localId).toSet();
    final existingIds = _annotations.keys.toSet();

    for (final id in existingIds.difference(currentIds)) {
      final annotation = _annotations.remove(id);
      if (annotation != null) await manager.delete(annotation);
    }

    for (final poi in widget.pois) {
      if (!_annotations.containsKey(poi.localId)) {
        final annotation = await manager.create(
          PointAnnotationOptions(
            geometry: Point(coordinates: Position(poi.lng, poi.lat)),
            iconSize: 1.0,
            textField: poi.title.isNotEmpty ? poi.title : null,
            textOffset: [0, 2.0],
            textSize: 12,
          ),
        );
        _annotations[poi.localId] = annotation;
      }
    }
  }

  Future<void> _flyTo(double lat, double lng) async {
    await _mapboxMap?.flyTo(
      CameraOptions(
        center: Point(coordinates: Position(lng, lat)),
        zoom: 15,
      ),
      MapAnimationOptions(duration: 800),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MapWidget(
      onMapCreated: _onMapCreated,
      onCameraChangeListener: (_) => _saveMapPosition(),
    );
  }
}
