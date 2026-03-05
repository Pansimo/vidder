import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String _translateError(AuthException e) {
    switch (e.message) {
      case 'Invalid login credentials':
        return 'Fel e-post eller lösenord.';
      case 'Email not confirmed':
        return 'Bekräfta din e-postadress först.';
      case 'User already registered':
        return 'E-postadressen är redan registrerad.';
      default:
        return e.message;
    }
  }

  Future<void> _submit(bool isLogin) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final email = _emailController.text.trim();
      final password = _passwordController.text;
      final supabase = Supabase.instance.client;
      if (isLogin) {
        await supabase.auth.signInWithPassword(email: email, password: password);
      } else {
        await supabase.auth.signUp(email: email, password: password);
      }
    } on AuthException catch (e) {
      setState(() => _error = _translateError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              const Text(
                'Vidder',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
              ),
              const Text(
                'Din personliga platsdagbok',
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 40),
              TabBar(
                controller: _tabController,
                tabs: const [Tab(text: 'Logga in'), Tab(text: 'Skapa konto')],
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _emailController,
                decoration: const InputDecoration(
                  labelText: 'E-post',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(
                  labelText: 'Lösenord',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
              ),
              const SizedBox(height: 8),
              if (_error != null)
                Text(_error!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
              AnimatedBuilder(
                animation: _tabController,
                builder: (_, __) {
                  final isLogin = _tabController.index == 0;
                  return ElevatedButton(
                    onPressed: _loading ? null : () => _submit(isLogin),
                    child: _loading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Text(isLogin ? 'Logga in' : 'Skapa konto'),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
