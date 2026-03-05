import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  const supabaseUrl = String.fromEnvironment('SUPABASE_URL');
  const supabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  const mapboxToken = String.fromEnvironment('MAPBOX_PUBLIC_TOKEN');

  await Supabase.initialize(url: supabaseUrl, anonKey: supabaseAnonKey);
  MapboxOptions.setAccessToken(mapboxToken);

  runApp(const VidderApp());
}
