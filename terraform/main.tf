terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

# -------------------------
# Security Group
# -------------------------

resource "aws_security_group" "lostlink_sg" {
  name        = "lostlink-security-group"
  description = "Security group for LostLink application"

  # SSH
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # LostLink application
  ingress {
    description = "LostLink application"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# -------------------------
# EC2 Instance
# -------------------------

resource "aws_instance" "lostlink_server" {
  ami           = "ami-0f918f7e67a3323f0"
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.lostlink_sg.id]

  key_name = "lostlink-key"
  
  tags = {
    Name = "LostLink-Server"
  }
}

# -------------------------
# Elastic IP
# -------------------------

resource "aws_eip" "lostlink_eip" {
  instance = aws_instance.lostlink_server.id

  tags = {
    Name = "LostLink-Elastic-IP"
  }
}

# -------------------------
# Outputs
# -------------------------

output "ec2_public_ip" {
  value = aws_instance.lostlink_server.public_ip
}

output "elastic_ip" {
  value = aws_eip.lostlink_eip.public_ip
}