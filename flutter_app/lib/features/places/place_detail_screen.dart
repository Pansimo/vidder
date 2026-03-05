import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/poi.dart';
import '../../core/database/poi_dao.dart';
import '../../core/sync/sync_service.dart';
import '../../services/image_service.dart';

class PlaceDetailScreen extends StatefulWidget {
  final Poi poi;
  final String userId;
  final void Function(double lat, double lng) onShowOnMap;

  const PlaceDetailScreen({
    super.key,
    required this.poi,
    required this.userId,
    required this.onShowOnMap,
  });

  @override
  State<PlaceDetailScreen> createState() => _PlaceDetailScreenState();
}

class _PlaceDetailScreenState extends State<PlaceDetailScreen> {
  late Poi _poi;
  late final TextEditingController _titleController;
  late final TextEditingController _noteController;
  final _dao = PoiDao();
  late final SyncService _syncService;
  final _imageService = ImageService();
  List<String> _imageUrls = [];
  bool _saving = false;
  bool _uploadingImage = false;

  @override
  void initState() {
    super.initState();
    _poi = widget.poi;
    _syncService = SyncService(_dao);
    _titleController = TextEditingController(text: _poi.title);
    _noteController = TextEditingController(text: _poi.note ?? '');
    if (_poi.serverId != null) _loadImages();
  }

  Future<void> _loadImages() async {
    final urls = await _imageService.getPoiImageUrls(_poi.serverId!);
    if (mounted) setState(() => _imageUrls = urls);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final title = _titleController.text.trim();
    final note = _noteController.text.trim();
    await _dao.updatePoiFields(_poi.localId, title: title, note: note.isEmpty ? null : note);
    final updated = _poi.copyWith(title: title, note: note.isEmpty ? null : note);
    setState(() {
      _poi = updated;
      _saving = false;
    });
    if (_poi.serverId != null) {
      unawaited(_syncService.updateServerPoi(
        _poi.serverId!,
        title: title,
        note: note.isEmpty ? null : note,
      ));
    }
    if (mounted) Navigator.pop(context, updated);
  }

  Future<void> _pickImage(bool fromCamera) async {
    final file = fromCamera
        ? await _imageService.pickFromCamera()
        : await _imageService.pickFromGallery();
    if (file == null) return;
    if (_poi.serverId == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Synka platsen för att lägga till bilder.')),
        );
      }
      return;
    }
    setState(() => _uploadingImage = true);
    final url = await _imageService.uploadImage(file, widget.userId, _poi.serverId!);
    if (mounted) {
      setState(() {
        if (url != null) _imageUrls = [..._imageUrls, url];
        _uploadingImage = false;
      });
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Plats'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Spara'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(
              controller: _titleController,
              decoration: const InputDecoration(
                labelText: 'Titel',
                hintText: 'Namnlös plats',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _noteController,
              decoration: const InputDecoration(
                labelText: 'Anteckning',
                border: OutlineInputBorder(),
              ),
              maxLines: 4,
            ),
            const SizedBox(height: 16),
            Text(
              '${_poi.lat.toStringAsFixed(5)}, ${_poi.lng.toStringAsFixed(5)}',
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 4),
            Text(
              _poi.createdAt.toLocal().toString().substring(0, 16),
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                const Text('Bilder', style: TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.camera_alt_outlined),
                  onPressed: _uploadingImage ? null : () => _pickImage(true),
                ),
                IconButton(
                  icon: const Icon(Icons.photo_library_outlined),
                  onPressed: _uploadingImage ? null : () => _pickImage(false),
                ),
              ],
            ),
            if (_uploadingImage) const Center(child: CircularProgressIndicator()),
            if (_imageUrls.isEmpty && _poi.serverId == null)
              const Text(
                'Synka platsen för att lägga till bilder.',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            if (_imageUrls.isNotEmpty)
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 4,
                  mainAxisSpacing: 4,
                ),
                itemCount: _imageUrls.length,
                itemBuilder: (context, i) => CachedNetworkImage(
                  imageUrl: _imageUrls[i],
                  fit: BoxFit.cover,
                ),
              ),
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                widget.onShowOnMap(_poi.lat, _poi.lng);
              },
              icon: const Icon(Icons.map_outlined),
              label: const Text('Visa på karta'),
            ),
          ],
        ),
      ),
    );
  }
}
