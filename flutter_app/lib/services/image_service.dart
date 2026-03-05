import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import 'package:path/path.dart' as p;

class ImageService {
  final _picker = ImagePicker();
  final _supabase = Supabase.instance.client;
  final _uuid = const Uuid();

  Future<XFile?> pickFromCamera() =>
      _picker.pickImage(source: ImageSource.camera, imageQuality: 85);

  Future<XFile?> pickFromGallery() =>
      _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);

  Future<String?> uploadImage(XFile file, String userId, String serverId) async {
    try {
      final ext = p.extension(file.path).replaceFirst('.', '');
      final fileName = '${_uuid.v4()}.$ext';
      final storagePath = '$userId/$serverId/$fileName';
      final bytes = await File(file.path).readAsBytes();

      await _supabase.storage.from('poi-images').uploadBinary(
        storagePath,
        bytes,
        fileOptions: FileOptions(contentType: 'image/$ext'),
      );

      await _supabase.from('poi_images').insert({
        'poi_id': serverId,
        'user_id': userId,
        'storage_path': storagePath,
      });

      return _supabase.storage.from('poi-images').getPublicUrl(storagePath);
    } catch (_) {
      return null;
    }
  }

  Future<List<String>> getPoiImageUrls(String serverId) async {
    try {
      final rows = await _supabase
          .from('poi_images')
          .select('storage_path')
          .eq('poi_id', serverId);
      return rows
          .map((r) => _supabase.storage
              .from('poi-images')
              .getPublicUrl(r['storage_path'] as String))
          .toList();
    } catch (_) {
      return [];
    }
  }
}
