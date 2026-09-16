import { Footer } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { BsFacebook, BsInstagram, BsLinkedin, BsGithub } from 'react-icons/bs';
import Logo from '../assets/logo.svg';

export default function FooterCom() {
  return (
    <Footer container className='border-t-8  bg-gray-800 text-white'>
      <div className='w-full max-w-7xl mx-auto'>
        <div className='grid w-full justify-between sm:flex md:grid-cols-1'>
          {/* Logo Section */}
          <div className='mt-5'>
            <Link to="/" className='self-center whitespace-nowrap text-lg sm:text-xl font-semibold dark:text-white'>
              <div className='flex flex-wrap self-center content-center justify-center gap-1'>
                <img src={Logo} alt="Blood Connect Logo" className='w-8' />
                <span>Blood Connect</span>
              </div>
            </Link>
          </div>

          {/* Footer Links */}
          <div className='grid grid-cols-2 gap-8 mt-4 sm:grid-cols-3 sm:gap-6'>
            {/* About Section */}
            <div>
              <Footer.Title title='About' />
              <Footer.LinkGroup col>
                <Footer.Link href='/' rel='noopener noreferrer'>
                  Our Mission
                </Footer.Link>
                <Footer.Link href='/' rel='noopener noreferrer'>
                  Our Team
                </Footer.Link>
              </Footer.LinkGroup>
            </div>

            {/* Resources Section */}
            <div>
              <Footer.Title title='Resources' />
              <Footer.LinkGroup col>
                <Footer.Link href='/faq' rel='noopener noreferrer'>
                  FAQ
                </Footer.Link>
                <Footer.Link href='/contactus' rel='noopener noreferrer'>
                  Contact Us
                </Footer.Link>
                <Footer.Link href='/language' rel='noopener noreferrer'>
                  Language
                </Footer.Link>
              </Footer.LinkGroup>
            </div>

            {/* Legal Section */}
            <div>
              <Footer.Title title='Legal' />
              <Footer.LinkGroup col>
                <Footer.Link href='/privacy' rel='noopener noreferrer'>
                  Privacy Policy
                </Footer.Link>
                <Footer.Link href='/terms' rel='noopener noreferrer'>
                  Terms of Service
                </Footer.Link>
              </Footer.LinkGroup>
            </div>
          </div>
        </div>

        <Footer.Divider />

        {/* Copyright and Social Icons */}
        <div className='w-full sm:flex sm:items-center sm:justify-between'>
          <Footer.Copyright href='#' by='SAM Group' year={new Date().getFullYear()} />
          <div className='flex gap-6 sm:mt-0 mt-4 sm:justify-center'>
            <Footer.Icon href='https://facebook.com' icon={BsFacebook} aria-label="Facebook" />
            <Footer.Icon href='https://linkedin.com' icon={BsLinkedin} aria-label="LinkedIn" />
            <Footer.Icon href='https://instagram.com' icon={BsInstagram} aria-label="Instagram" />
            <Footer.Icon href='https://github.com' icon={BsGithub} aria-label="GitHub" />
          </div>
        </div>
      </div>
    </Footer>
  );
}