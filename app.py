import os
import pymysql
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# 從環境變數讀取資料庫連線資訊，如果沒有設定 (例如在本地直接跑 python app.py) 則預設為本地端 localhost 的設定
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 8625))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'rootpassword')
DB_NAME = os.environ.get('DB_NAME', 'cki101_db')

def get_db_connection():
    """取得 MySQL 資料庫連線"""
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )

def init_db():
    """初始化資料庫表"""
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            # 如果 users 資料表不存在，則建立它 (包含 id, name, age)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    age INT NOT NULL
                )
            ''')
        connection.commit()
        connection.close()
        print("✅ 資料庫初始化成功！")
    except Exception as e:
        print(f"❌ 資料庫初始化失敗: {e}")

@app.route('/')
def hello():
    return "我是功能一的文字"

@app.route('/users')
def users_page():
    """渲染使用者管理介面"""
    return render_template('users.html')

@app.route('/user', methods=['GET'])
def get_users():
    """查詢所有使用者"""
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users")
            users = cursor.fetchall()
        connection.close()
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/user', methods=['POST'])
def add_user():
    """新增使用者"""
    data = request.get_json()
    if not data or 'name' not in data or 'age' not in data:
        return jsonify({'error': '請提供 name 和 age'}), 400
        
    name = data['name']
    age = data['age']
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO users (name, age) VALUES (%s, %s)", (name, age))
            new_id = cursor.lastrowid
        connection.commit()
        connection.close()
        return jsonify({'message': '新增成功', 'id': new_id}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """刪除使用者"""
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            deleted_count = cursor.rowcount
        connection.commit()
        connection.close()
        
        if deleted_count == 0:
            return jsonify({'error': '找不到該使用者'}), 404
            
        return jsonify({'message': '刪除成功'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/user/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """更新使用者"""
    data = request.get_json()
    if not data or 'name' not in data or 'age' not in data:
        return jsonify({'error': '請提供 name 和 age'}), 400
        
    name = data['name']
    age = data['age']
    
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("UPDATE users SET name = %s, age = %s WHERE id = %s", (name, age, user_id))
            updated_count = cursor.rowcount
        connection.commit()
        connection.close()
        
        if updated_count == 0:
            return jsonify({'error': '找不到該使用者，或資料未更動'}), 404
            
        return jsonify({'message': '更新成功'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # 啟動伺服器前，先確保資料表已經建立
    init_db()
    app.run(host='0.0.0.0', port=5000)
