import requests
import sys
import json
import io
from datetime import datetime
from pathlib import Path

class BehancePortfolioAPITester:
    def __init__(self, base_url="https://behance-style.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.uploaded_files = []
        self.created_projects = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, headers=headers, params=params, timeout=60)
                else:
                    headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=headers, params=params, timeout=30)
            elif method == 'PUT':
                headers['Content-Type'] = 'application/json'
                response = requests.put(url, json=data, headers=headers, params=params, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_upload_image(self):
        """Test image upload"""
        # Create a simple test image (1x1 pixel PNG)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x12IDATx\x9cc```bPPP\x00\x02\xac\xea\x05\x1b\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {
            'file': ('test_image.png', io.BytesIO(png_data), 'image/png')
        }
        
        success, response = self.run_test("Upload Image", "POST", "upload", 200, files=files)
        if success and 'id' in response:
            self.uploaded_files.append(response)
            return response
        return None

    def test_upload_invalid_file(self):
        """Test upload with invalid file type"""
        files = {
            'file': ('test.txt', io.BytesIO(b'test content'), 'text/plain')
        }
        
        return self.run_test("Upload Invalid File", "POST", "upload", 400, files=files)

    def test_create_project(self):
        """Test project creation"""
        project_data = {
            "title": "Test Project",
            "description": "This is a test project for the portfolio",
            "category": "Design Gráfico",
            "tags": ["test", "portfolio", "design"],
            "tools": ["Photoshop", "Illustrator"],
            "visibility": "public",
            "published": True
        }
        
        success, response = self.run_test("Create Project", "POST", "projects", 200, data=project_data)
        if success and 'id' in response:
            self.created_projects.append(response)
            return response
        return None

    def test_create_project_missing_title(self):
        """Test project creation without required title"""
        project_data = {
            "description": "Project without title",
            "category": "Design Gráfico"
        }
        
        return self.run_test("Create Project Missing Title", "POST", "projects", 422, data=project_data)

    def test_get_projects(self):
        """Test getting all projects"""
        return self.run_test("Get All Projects", "GET", "projects", 200)

    def test_get_project_by_id(self, project_id):
        """Test getting a specific project"""
        return self.run_test("Get Project by ID", "GET", f"projects/{project_id}", 200)

    def test_get_nonexistent_project(self):
        """Test getting a non-existent project"""
        return self.run_test("Get Non-existent Project", "GET", "projects/nonexistent-id", 404)

    def test_add_image_to_project(self, project_id, storage_path):
        """Test adding image to project"""
        return self.run_test(
            "Add Image to Project", 
            "POST", 
            f"projects/{project_id}/images",
            200,
            params={"storage_path": storage_path}
        )

    def test_set_project_cover(self, project_id, storage_path):
        """Test setting project cover image"""
        return self.run_test(
            "Set Project Cover", 
            "POST", 
            f"projects/{project_id}/cover",
            200,
            params={"storage_path": storage_path}
        )

    def test_update_project(self, project_id):
        """Test updating a project"""
        update_data = {
            "title": "Updated Test Project",
            "description": "Updated description",
            "visibility": "private"
        }
        
        return self.run_test("Update Project", "PUT", f"projects/{project_id}", 200, data=update_data)

    def test_download_file(self, storage_path):
        """Test downloading uploaded file"""
        return self.run_test("Download File", "GET", f"files/{storage_path}", 200)

def main():
    print("🚀 Starting Behance Portfolio API Tests")
    print("=" * 50)
    
    tester = BehancePortfolioAPITester()
    
    # Test API root
    tester.test_api_root()
    
    # Test file upload
    uploaded_file = tester.test_upload_image()
    tester.test_upload_invalid_file()
    
    # Test project creation
    created_project = tester.test_create_project()
    tester.test_create_project_missing_title()
    
    # Test project retrieval
    tester.test_get_projects()
    if created_project:
        tester.test_get_project_by_id(created_project['id'])
    tester.test_get_nonexistent_project()
    
    # Test project-image operations
    if created_project and uploaded_file:
        project_id = created_project['id']
        storage_path = uploaded_file['storage_path']
        
        tester.test_add_image_to_project(project_id, storage_path)
        tester.test_set_project_cover(project_id, storage_path)
        tester.test_update_project(project_id)
        tester.test_download_file(storage_path)
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())